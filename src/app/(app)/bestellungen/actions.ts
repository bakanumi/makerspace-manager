"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

const orderInputSchema = z.object({
  customerId: z.string().min(1, "Kunde fehlt"),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
      })
    )
    .min(1, "Mindestens eine Position nötig"),
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
      const products = await tx.product.findMany({
        where: { id: { in: data.items.map((i) => i.productId) }, organizationId },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      for (const item of data.items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error("Produkt nicht gefunden");
        if (product.stock < item.quantity) {
          throw new Error(`Nicht genug Lagerbestand für "${product.name}"`);
        }
      }

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          organizationId,
          customerId: data.customerId,
          note: data.note || null,
          items: { create: data.items },
        },
      });
    });

    revalidatePath("/bestellungen");
    revalidatePath("/produkte");
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

export async function updateOrderStatus(id: string, status: string) {
  const organizationId = await requireOrgId();
  const parsedStatus = statusSchema.parse(status);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id, organizationId },
      include: { items: true },
    });

    const wasCancelled = order.status === "STORNIERT";
    const isCancelling = parsedStatus === "STORNIERT";

    if (isCancelling && !wasCancelled) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    } else if (!isCancelling && wasCancelled) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    await tx.order.update({ where: { id }, data: { status: parsedStatus } });
  });

  revalidatePath("/bestellungen");
  revalidatePath("/produkte");
}

export async function deleteOrder(id: string) {
  const organizationId = await requireOrgId();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id, organizationId },
      include: { items: true },
    });

    if (order.status !== "STORNIERT") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await tx.order.delete({ where: { id } });
  });

  revalidatePath("/bestellungen");
  revalidatePath("/produkte");
}
