"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

export type InvoiceState = { error?: string; success?: boolean; id?: string };

export async function createInvoiceForOrder(orderId: string): Promise<InvoiceState> {
  const organizationId = await requireOrgId();

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId, organizationId },
        include: { items: true, invoice: true },
      });

      if (order.invoice) {
        throw new Error("Für diese Bestellung existiert bereits eine Rechnung");
      }
      if (order.status === "STORNIERT") {
        throw new Error("Stornierte Bestellungen können nicht abgerechnet werden");
      }

      const totalNet = order.items.reduce(
        (sum, i) => sum + Number(i.unitPrice) * i.quantity,
        0
      );
      const vatRate = Number(org.vatRatePercent);
      const totalGross =
        org.taxMode === "REGELBESTEUERUNG" ? totalNet * (1 + vatRate / 100) : totalNet;

      const nextCounter = org.invoiceCounter + 1;
      const number = `${org.invoiceNumberPrefix}-${String(nextCounter).padStart(4, "0")}`;

      await tx.organization.update({
        where: { id: organizationId },
        data: { invoiceCounter: nextCounter },
      });

      return tx.invoice.create({
        data: {
          organizationId,
          orderId,
          number,
          totalNet,
          totalGross,
          taxMode: org.taxMode,
          vatRatePercent: org.vatRatePercent,
        },
      });
    });

    revalidatePath("/rechnungen");
    return { success: true, id: invoice.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fehler beim Erstellen" };
  }
}
