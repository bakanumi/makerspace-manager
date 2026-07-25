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
        include: { items: true, invoices: true, voucherRedemptions: true },
      });

      if (order.invoices.some((inv) => !inv.correctsInvoiceId)) {
        throw new Error("Für diese Bestellung existiert bereits eine Rechnung");
      }
      if (order.status === "STORNIERT") {
        throw new Error("Stornierte Bestellungen können nicht abgerechnet werden");
      }

      const itemsSubtotal = order.items.reduce(
        (sum, i) => sum + Number(i.unitPrice) * i.quantity,
        0
      );
      const discountAmount = Number(order.discountAmount);
      const shippingCost = Number(order.shippingCost);
      const voucherTotal = order.voucherRedemptions.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalNet = Math.max(0, itemsSubtotal - discountAmount) + shippingCost - voucherTotal;
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
          discountAmount,
          shippingCost,
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

export async function createCorrectionInvoice(originalInvoiceId: string): Promise<InvoiceState> {
  const organizationId = await requireOrgId();

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const original = await tx.invoice.findUniqueOrThrow({
        where: { id: originalInvoiceId, organizationId },
        include: { correction: true },
      });

      if (original.correction) {
        throw new Error("Für diese Rechnung existiert bereits eine Korrekturrechnung");
      }

      const nextCounter = org.invoiceCounter + 1;
      const number = `${org.invoiceNumberPrefix}-${String(nextCounter).padStart(4, "0")}`;

      await tx.organization.update({
        where: { id: organizationId },
        data: { invoiceCounter: nextCounter },
      });

      return tx.invoice.create({
        data: {
          organizationId,
          orderId: original.orderId,
          number,
          totalNet: original.totalNet.negated(),
          totalGross: original.totalGross.negated(),
          discountAmount: original.discountAmount,
          shippingCost: original.shippingCost,
          taxMode: original.taxMode,
          vatRatePercent: original.vatRatePercent,
          correctsInvoiceId: original.id,
        },
      });
    });

    revalidatePath("/rechnungen");
    return { success: true, id: invoice.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fehler beim Erstellen" };
  }
}

/**
 * Storniert die aktuell aktive Rechnung einer Bestellung (falls vorhanden) per
 * Korrekturrechnung und stellt sofort eine neue Rechnung mit den aktuellen
 * Bestelldaten aus. Für Bestellungen, die nach Rechnungsstellung bearbeitet wurden.
 */
export async function reissueInvoiceForOrder(orderId: string): Promise<InvoiceState> {
  const organizationId = await requireOrgId();

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      let org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId, organizationId },
        include: { items: true, voucherRedemptions: true, invoices: true },
      });

      if (order.status === "STORNIERT") {
        throw new Error("Stornierte Bestellungen können nicht abgerechnet werden");
      }

      const activeInvoice = order.invoices.find(
        (inv) =>
          !inv.correctsInvoiceId &&
          !order.invoices.some((other) => other.correctsInvoiceId === inv.id)
      );

      if (activeInvoice) {
        const correctionCounter = org.invoiceCounter + 1;
        const correctionNumber = `${org.invoiceNumberPrefix}-${String(correctionCounter).padStart(4, "0")}`;
        org = await tx.organization.update({
          where: { id: organizationId },
          data: { invoiceCounter: correctionCounter },
        });
        await tx.invoice.create({
          data: {
            organizationId,
            orderId,
            number: correctionNumber,
            totalNet: activeInvoice.totalNet.negated(),
            totalGross: activeInvoice.totalGross.negated(),
            discountAmount: activeInvoice.discountAmount,
            shippingCost: activeInvoice.shippingCost,
            taxMode: activeInvoice.taxMode,
            vatRatePercent: activeInvoice.vatRatePercent,
            correctsInvoiceId: activeInvoice.id,
          },
        });
      }

      const itemsSubtotal = order.items.reduce(
        (sum, i) => sum + Number(i.unitPrice) * i.quantity,
        0
      );
      const discountAmount = Number(order.discountAmount);
      const shippingCost = Number(order.shippingCost);
      const voucherTotal = order.voucherRedemptions.reduce((sum, r) => sum + Number(r.amount), 0);
      const totalNet = Math.max(0, itemsSubtotal - discountAmount) + shippingCost - voucherTotal;
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
          discountAmount,
          shippingCost,
          taxMode: org.taxMode,
          vatRatePercent: org.vatRatePercent,
        },
      });
    });

    revalidatePath("/rechnungen");
    return { success: true, id: invoice.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fehler beim Aktualisieren" };
  }
}
