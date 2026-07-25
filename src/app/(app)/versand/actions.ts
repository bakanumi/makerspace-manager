"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

const shippingSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  carrier: z.enum(["DHL", "HERMES", "DPD", "POST", "SONSTIGE"]),
  cost: z.coerce.number().min(0),
});

export type ShippingState = { error?: string; success?: boolean };

export async function createShippingOption(
  _prevState: ShippingState,
  formData: FormData
): Promise<ShippingState> {
  const organizationId = await requireOrgId();
  const parsed = shippingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.shippingOption.create({ data: { ...parsed.data, organizationId } });
  revalidatePath("/versand");
  return { success: true };
}

export async function updateShippingOption(
  _prevState: ShippingState,
  formData: FormData
): Promise<ShippingState> {
  const organizationId = await requireOrgId();
  const id = formData.get("id") as string;
  const parsed = shippingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.shippingOption.update({
    where: { id, organizationId },
    data: parsed.data,
  });
  revalidatePath("/versand");
  return { success: true };
}

export async function deleteShippingOption(id: string) {
  const organizationId = await requireOrgId();
  await prisma.shippingOption.delete({ where: { id, organizationId } });
  revalidatePath("/versand");
}
