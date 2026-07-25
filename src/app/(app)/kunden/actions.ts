"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

const emptyToNull = (v: unknown) => (v === "" ? null : v);
const optionalText = () => z.preprocess(emptyToNull, z.string().nullable());

const customerSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  email: z.preprocess(emptyToNull, z.string().email("Ungültige E-Mail").nullable()),
  phone: optionalText(),
  addressLine1: optionalText(),
  addressLine2: optionalText(),
  postalCode: optionalText(),
  city: optionalText(),
  country: z.string().min(1),
  note: optionalText(),
});

export type CustomerState = { error?: string; success?: boolean };

export async function createCustomer(
  _prevState: CustomerState,
  formData: FormData
): Promise<CustomerState> {
  const organizationId = await requireOrgId();
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.customer.create({ data: { ...parsed.data, organizationId } });
  revalidatePath("/kunden");
  return { success: true };
}

export async function updateCustomer(
  _prevState: CustomerState,
  formData: FormData
): Promise<CustomerState> {
  const organizationId = await requireOrgId();
  const id = formData.get("id") as string;
  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.customer.update({
    where: { id, organizationId },
    data: parsed.data,
  });
  revalidatePath("/kunden");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const organizationId = await requireOrgId();
  await prisma.customer.delete({ where: { id, organizationId } });
  revalidatePath("/kunden");
}
