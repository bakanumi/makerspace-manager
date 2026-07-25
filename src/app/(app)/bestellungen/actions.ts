"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

const orderItemSchema = z
  .object({
    productId: z.string().min(1).optional(),
    calculationId: z.string().min(1).optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })
  .refine((item) => !!item.productId !== !!item.calculationId, {
    message: "Jede Position braucht entweder ein Produkt oder eine Kalkulation",
  });

const orderInputSchema = z.object({
  customerId: z.string().min(1, "Kunde fehlt"),
  note: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "Mindestens eine Position nötig"),
  shippingOptionId: z.string().optional(),
  couponCode: z.string().optional(),
  voucherCode: z.string().optional(),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderState = { error?: string; success?: boolean; id?: string };

type OrderItemInput = {
  productId?: string | null;
  calculationId?: string | null;
  quantity: number;
  unitPrice: number;
};

type StockItemInput = {
  productId?: string | null;
  calculationId?: string | null;
  quantity: number;
};

/** Prüft Lagerbestand (Produkte + Material aus Kalkulationen) und zieht ihn ab. Wirft bei nicht ausreichendem Bestand. */
async function consumeStockForItems(
  tx: Prisma.TransactionClient,
  organizationId: string,
  items: StockItemInput[]
) {
  const productIds = items.map((i) => i.productId).filter((id): id is string => !!id);
  const products = await tx.product.findMany({ where: { id: { in: productIds }, organizationId } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const calculationIds = items.map((i) => i.calculationId).filter((id): id is string => !!id);
  const calculations = await tx.calculation.findMany({
    where: { id: { in: calculationIds }, organizationId },
    include: { materialLines: { include: { material: true } } },
  });
  const calculationMap = new Map(calculations.map((c) => [c.id, c]));

  // Benötigten Materialverbrauch je Material aufsummieren, um Mehrfachverbrauch korrekt zu prüfen.
  const materialNeed = new Map<string, { name: string; amount: number; current: number }>();

  for (const item of items) {
    if (item.productId) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("Produkt nicht gefunden");
      if (product.stock < item.quantity) {
        throw new Error(`Nicht genug Lagerbestand für "${product.name}"`);
      }
    }
    if (item.calculationId) {
      const calc = calculationMap.get(item.calculationId);
      if (!calc) throw new Error("Kalkulation nicht gefunden");
      for (const line of calc.materialLines) {
        const need = Number(line.amount) * item.quantity;
        const entry = materialNeed.get(line.materialId);
        if (entry) {
          entry.amount += need;
        } else {
          materialNeed.set(line.materialId, {
            name: line.material.name,
            amount: need,
            current: Number(line.material.stock),
          });
        }
      }
    }
  }

  for (const [, need] of materialNeed) {
    if (need.current < need.amount) {
      throw new Error(`Nicht genug Material auf Lager: "${need.name}"`);
    }
  }

  for (const item of items) {
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }
  for (const [materialId, need] of materialNeed) {
    await tx.material.update({
      where: { id: materialId },
      data: { stock: { decrement: need.amount } },
    });
  }
}

/** Bucht Lagerbestand (Produkte + Material) für die gegebenen Positionen zurück. */
async function restoreStockForItems(
  tx: Prisma.TransactionClient,
  organizationId: string,
  items: StockItemInput[]
) {
  const calculationIds = items.map((i) => i.calculationId).filter((id): id is string => !!id);
  const calculations = await tx.calculation.findMany({
    where: { id: { in: calculationIds }, organizationId },
    include: { materialLines: true },
  });
  const calculationMap = new Map(calculations.map((c) => [c.id, c]));

  const materialRestore = new Map<string, number>();

  for (const item of items) {
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    if (item.calculationId) {
      const calc = calculationMap.get(item.calculationId);
      if (!calc) continue;
      for (const line of calc.materialLines) {
        const amount = Number(line.amount) * item.quantity;
        materialRestore.set(line.materialId, (materialRestore.get(line.materialId) ?? 0) + amount);
      }
    }
  }

  for (const [materialId, amount] of materialRestore) {
    await tx.material.update({ where: { id: materialId }, data: { stock: { increment: amount } } });
  }
}

async function applyDiscountAndShipping(
  tx: Prisma.TransactionClient,
  organizationId: string,
  data: { items: OrderItemInput[]; shippingOptionId?: string; couponCode?: string; voucherCode?: string },
  orderId: string
) {
  const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  let shippingCost = 0;
  if (data.shippingOptionId) {
    const shipping = await tx.shippingOption.findUnique({
      where: { id: data.shippingOptionId, organizationId },
    });
    if (!shipping) throw new Error("Versandart nicht gefunden");
    shippingCost = Number(shipping.cost);
  }

  let couponId: string | null = null;
  let discountAmount = 0;
  if (data.couponCode) {
    const coupon = await tx.coupon.findUnique({
      where: { organizationId_code: { organizationId, code: data.couponCode.trim() } },
    });
    if (!coupon || !coupon.active) throw new Error("Rabattcode ungültig");
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) throw new Error("Rabattcode noch nicht gültig");
    if (coupon.validUntil && now > coupon.validUntil) throw new Error("Rabattcode abgelaufen");
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new Error("Rabattcode wurde bereits zu oft verwendet");
    }
    discountAmount =
      coupon.type === "PERCENT"
        ? subtotal * (Number(coupon.value) / 100)
        : Math.min(Number(coupon.value), subtotal);
    couponId = coupon.id;
    await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  const remainingAfterDiscount = Math.max(0, subtotal - discountAmount) + shippingCost;

  if (data.voucherCode) {
    const voucher = await tx.giftVoucher.findUnique({
      where: { organizationId_code: { organizationId, code: data.voucherCode.trim() } },
    });
    if (!voucher) throw new Error("Gutschein-Code ungültig");
    if (Number(voucher.remainingValue) <= 0) throw new Error("Gutschein ist bereits aufgebraucht");
    const redeemAmount = Math.min(Number(voucher.remainingValue), remainingAfterDiscount);
    if (redeemAmount > 0) {
      await tx.giftVoucher.update({
        where: { id: voucher.id },
        data: { remainingValue: { decrement: redeemAmount } },
      });
      await tx.voucherRedemption.create({
        data: { voucherId: voucher.id, orderId, amount: redeemAmount },
      });
    }
  }

  return { shippingCost, couponId, discountAmount };
}

export async function createOrder(input: OrderInput): Promise<OrderState> {
  const organizationId = await requireOrgId();
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }
  const data = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      await consumeStockForItems(tx, organizationId, data.items);

      const order = await tx.order.create({
        data: {
          organizationId,
          customerId: data.customerId,
          note: data.note || null,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId ?? null,
              calculationId: i.calculationId ?? null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
      });

      const { shippingCost, couponId, discountAmount } = await applyDiscountAndShipping(
        tx,
        organizationId,
        data,
        order.id
      );

      return tx.order.update({
        where: { id: order.id },
        data: { shippingOptionId: data.shippingOptionId || null, shippingCost, couponId, discountAmount },
      });
    });

    revalidatePath("/bestellungen");
    revalidatePath("/produkte");
    revalidatePath("/inventar/material");
    revalidatePath("/gutscheine");
    return { success: true, id: order.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fehler beim Anlegen" };
  }
}

export async function updateOrder(orderId: string, input: OrderInput): Promise<OrderState> {
  const organizationId = await requireOrgId();
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }
  const data = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUniqueOrThrow({
        where: { id: orderId, organizationId },
        include: { items: true, voucherRedemptions: true },
      });

      // Alte Effekte rückgängig machen (außer bei stornierten Bestellungen, die haben keine aktiven Effekte mehr).
      if (existing.status !== "STORNIERT") {
        await restoreStockForItems(tx, organizationId, existing.items);
        if (existing.couponId) {
          await tx.coupon.update({ where: { id: existing.couponId }, data: { usedCount: { decrement: 1 } } });
        }
        for (const redemption of existing.voucherRedemptions) {
          await tx.giftVoucher.update({
            where: { id: redemption.voucherId },
            data: { remainingValue: { increment: Number(redemption.amount) } },
          });
        }
      }
      await tx.voucherRedemption.deleteMany({ where: { orderId } });
      await tx.orderItem.deleteMany({ where: { orderId } });

      // Neue Effekte anwenden (nur falls die Bestellung nicht storniert ist).
      let shippingCost = 0;
      let couponId: string | null = null;
      let discountAmount = 0;
      if (existing.status !== "STORNIERT") {
        await consumeStockForItems(tx, organizationId, data.items);
        const applied = await applyDiscountAndShipping(tx, organizationId, data, orderId);
        shippingCost = applied.shippingCost;
        couponId = applied.couponId;
        discountAmount = applied.discountAmount;
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          customerId: data.customerId,
          note: data.note || null,
          shippingOptionId: data.shippingOptionId || null,
          shippingCost,
          couponId,
          discountAmount,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId ?? null,
              calculationId: i.calculationId ?? null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
      });
    });

    revalidatePath("/bestellungen");
    revalidatePath("/produkte");
    revalidatePath("/inventar/material");
    revalidatePath("/gutscheine");
    revalidatePath("/rechnungen");
    return { success: true, id: order.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fehler beim Aktualisieren" };
  }
}

const statusSchema = z.enum([
  "OFFEN",
  "IN_ARBEIT",
  "FERTIG",
  "VERSENDET",
  "BEZAHLT",
  "STORNIERT",
]);

async function rollbackOrderSideEffects(
  tx: Prisma.TransactionClient,
  organizationId: string,
  orderId: string,
  direction: "restore" | "reapply"
) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, voucherRedemptions: true },
  });

  if (direction === "restore") {
    await restoreStockForItems(tx, organizationId, order.items);
  } else {
    await consumeStockForItems(tx, organizationId, order.items);
  }

  if (order.couponId) {
    await tx.coupon.update({
      where: { id: order.couponId },
      data: { usedCount: { increment: direction === "restore" ? -1 : 1 } },
    });
  }

  for (const redemption of order.voucherRedemptions) {
    const sign = direction === "restore" ? 1 : -1;
    await tx.giftVoucher.update({
      where: { id: redemption.voucherId },
      data: { remainingValue: { increment: sign * Number(redemption.amount) } },
    });
  }
}

export async function updateOrderStatus(id: string, status: string) {
  const organizationId = await requireOrgId();
  const parsedStatus = statusSchema.parse(status);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id, organizationId } });

    const wasCancelled = order.status === "STORNIERT";
    const isCancelling = parsedStatus === "STORNIERT";

    if (isCancelling && !wasCancelled) {
      await rollbackOrderSideEffects(tx, organizationId, id, "restore");
    } else if (!isCancelling && wasCancelled) {
      await rollbackOrderSideEffects(tx, organizationId, id, "reapply");
    }

    await tx.order.update({ where: { id }, data: { status: parsedStatus } });
  });

  revalidatePath("/bestellungen");
  revalidatePath("/produkte");
  revalidatePath("/inventar/material");
  revalidatePath("/gutscheine");
}

export async function deleteOrder(id: string) {
  const organizationId = await requireOrgId();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id, organizationId } });

    if (order.status !== "STORNIERT") {
      await rollbackOrderSideEffects(tx, organizationId, id, "restore");
    }

    await tx.order.delete({ where: { id } });
  });

  revalidatePath("/bestellungen");
  revalidatePath("/produkte");
  revalidatePath("/inventar/material");
  revalidatePath("/gutscheine");
}
