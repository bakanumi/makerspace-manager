"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

const quoteItemSchema = z
  .object({
    productId: z.string().min(1).optional(),
    calculationId: z.string().min(1).optional(),
    description: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
  })
  .refine((item) => !!item.productId !== !!item.calculationId, {
    message: "Jede Position braucht entweder ein Produkt oder eine Kalkulation",
  });

const quoteInputSchema = z.object({
  customerId: z.string().min(1, "Kunde fehlt"),
  items: z.array(quoteItemSchema).min(1, "Mindestens eine Position nötig"),
  discountAmount: z.number().min(0).default(0),
  validUntil: z.string().optional(),
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;
export type QuoteState = { error?: string; success?: boolean; id?: string };

export async function createQuote(input: QuoteInput): Promise<QuoteState> {
  const organizationId = await requireOrgId();
  const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }
  const data = parsed.data;

  try {
    const quote = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUniqueOrThrow({ where: { id: organizationId } });
      const nextCounter = org.offerCounter + 1;
      const number = `${org.offerNumberPrefix}-${String(nextCounter).padStart(4, "0")}`;

      await tx.organization.update({
        where: { id: organizationId },
        data: { offerCounter: nextCounter },
      });

      return tx.quote.create({
        data: {
          organizationId,
          customerId: data.customerId,
          number,
          discountAmount: data.discountAmount,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId ?? null,
              calculationId: i.calculationId ?? null,
              description: i.description || null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
      });
    });

    revalidatePath("/angebote");
    return { success: true, id: quote.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Fehler beim Erstellen" };
  }
}

const statusSchema = z.enum(["OFFEN", "ANGENOMMEN", "ABGELEHNT", "ABGELAUFEN"]);

export async function updateQuoteStatus(id: string, status: string) {
  const organizationId = await requireOrgId();
  const parsedStatus = statusSchema.parse(status);
  await prisma.quote.update({ where: { id, organizationId }, data: { status: parsedStatus } });
  revalidatePath("/angebote");
}

export async function deleteQuote(id: string) {
  const organizationId = await requireOrgId();
  await prisma.quote.delete({ where: { id, organizationId } });
  revalidatePath("/angebote");
}
