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

export async function createOrder(input: OrderInput): Promise<OrderState> {
  const organizationId = await requireOrgId();
  const parsed = orderInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }
  const data = parsed.data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const productIds = data.items.map((i) => i.productId).filter((id): id is string => !!id);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, organizationId },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of data.items) {
        if (!item.productId) continue;
        const product = productMap.get(item.productId);
        if (!product) throw new Error("Produkt nicht gefunden");
        if (product.stock < item.quantity) {
          throw new Error(`Nicht genug Lagerbestand für "${product.name}"`);
        }
      }

      for (const item of data.items) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

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

      const order = await tx.order.create({
        data: {
          organizationId,
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
            data: { voucherId: voucher.id, orderId: order.id, amount: redeemAmount },
          });
        }
      }

      return order;
    });

    revalidatePath("/bestellungen");
    revalidatePath("/produkte");
    revalidatePath("/gutscheine");
    return { success: true, id: order.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fehler beim Anlegen" };
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
  orderId: string,
  direction: "restore" | "reapply"
) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, voucherRedemptions: true },
  });

  const sign = direction === "restore" ? 1 : -1;

  for (const item of order.items) {
    if (!item.productId) continue;
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: sign * item.quantity } },
    });
  }

  if (order.couponId) {
    await tx.coupon.update({
      where: { id: order.couponId },
      data: { usedCount: { increment: direction === "restore" ? -1 : 1 } },
    });
  }

  for (const redemption of order.voucherRedemptions) {
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
      await rollbackOrderSideEffects(tx, id, "restore");
    } else if (!isCancelling && wasCancelled) {
      await rollbackOrderSideEffects(tx, id, "reapply");
    }

    await tx.order.update({ where: { id }, data: { status: parsedStatus } });
  });

  revalidatePath("/bestellungen");
  revalidatePath("/produkte");
  revalidatePath("/gutscheine");
}

export async function deleteOrder(id: string) {
  const organizationId = await requireOrgId();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id, organizationId } });

    if (order.status !== "STORNIERT") {
      await rollbackOrderSideEffects(tx, id, "restore");
    }

    await tx.order.delete({ where: { id } });
  });

  revalidatePath("/bestellungen");
  revalidatePath("/produkte");
  revalidatePath("/gutscheine");
}
