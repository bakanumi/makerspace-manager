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

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId },
    include: {
      organization: true,
      order: {
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    InvoicePdf({
      invoiceNumber: invoice.number,
      issuedAt: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(
        invoice.issuedAt
      ),
      taxMode: invoice.taxMode,
      vatRatePercent: Number(invoice.vatRatePercent),
      totalNet: Number(invoice.totalNet),
      totalGross: Number(invoice.totalGross),
      organization: {
        name: invoice.organization.name,
        addressLine1: invoice.organization.addressLine1,
        postalCode: invoice.organization.postalCode,
        city: invoice.organization.city,
        country: invoice.organization.country,
        email: invoice.organization.email,
        taxId: invoice.organization.taxId,
      },
      customer: {
        name: invoice.order.customer.name,
        addressLine1: invoice.order.customer.addressLine1,
        postalCode: invoice.order.customer.postalCode,
        city: invoice.order.customer.city,
        country: invoice.order.customer.country,
      },
      items: invoice.order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
    })
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
    },
  });
}
