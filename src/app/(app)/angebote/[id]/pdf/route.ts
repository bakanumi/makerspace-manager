import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { InvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const organizationId = await requireOrgId();
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id, organizationId },
    include: {
      organization: true,
      customer: true,
      items: {
        include: {
          product: {
            include: { calculation: { include: { materialLines: { include: { material: true } } } } },
          },
          calculation: { include: { materialLines: { include: { material: true } } } },
        },
      },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });
  }

  const resolveItemMaterial = (item: (typeof quote.items)[number]) =>
    item.calculation?.materialLines[0]?.material ??
    item.product?.calculation?.materialLines[0]?.material ??
    null;

  const itemsSubtotal = quote.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );
  const discountAmount = Number(quote.discountAmount);
  const totalNet = Math.max(0, itemsSubtotal - discountAmount);
  const vatRate = Number(quote.organization.vatRatePercent);
  const totalGross =
    quote.organization.taxMode === "REGELBESTEUERUNG" ? totalNet * (1 + vatRate / 100) : totalNet;

  const buffer = await renderToBuffer(
    InvoicePdf({
      kind: "Angebot",
      documentNumber: quote.number,
      issuedAt: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(quote.issuedAt),
      validUntil: quote.validUntil
        ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(quote.validUntil)
        : undefined,
      taxMode: quote.organization.taxMode,
      vatRatePercent: vatRate,
      itemsSubtotal,
      discountAmount,
      voucherAmount: 0,
      shippingCost: 0,
      totalNet,
      totalGross,
      pdfTemplate: quote.organization.pdfTemplate,
      organization: {
        name: quote.organization.name,
        addressLine1: quote.organization.addressLine1,
        postalCode: quote.organization.postalCode,
        city: quote.organization.city,
        country: quote.organization.country,
        email: quote.organization.email,
        phone: quote.organization.phone,
        taxId: quote.organization.taxId,
        logoUrl: quote.organization.logoUrl,
        footerText: quote.organization.invoiceFooterText,
        showPhone: quote.organization.invoiceShowPhone,
        showEmail: quote.organization.invoiceShowEmail,
      },
      customer: {
        name: quote.customer.name,
        addressLine1: quote.customer.addressLine1,
        postalCode: quote.customer.postalCode,
        city: quote.customer.city,
        country: quote.customer.country,
        customerNumber: quote.customer.customerNumber,
      },
      items: quote.items.map((item) => {
        const material = resolveItemMaterial(item);
        return {
          name: item.product?.name ?? item.description ?? item.calculation?.name ?? "Position",
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          color: material?.color ?? null,
          material: material?.type ?? null,
        };
      }),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.number}.pdf"`,
    },
  });
}
