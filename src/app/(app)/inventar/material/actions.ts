"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

const materialSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  type: z.string().min(1, "Typ fehlt"),
  unit: z.enum(["GRAMM", "MILLILITER", "STUECK", "METER"]),
  stock: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0),
  pricePerUnit: z.coerce.number().min(0),
  supplier: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  note: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
});

export type MaterialState = { error?: string; success?: boolean };

export async function createMaterial(
  _prevState: MaterialState,
  formData: FormData
): Promise<MaterialState> {
  const organizationId = await requireOrgId();
  const parsed = materialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.material.create({ data: { ...parsed.data, organizationId } });
  revalidatePath("/inventar/material");
  return { success: true };
}

export async function updateMaterial(
  _prevState: MaterialState,
  formData: FormData
): Promise<MaterialState> {
  const organizationId = await requireOrgId();
  const id = formData.get("id") as string;
  const parsed = materialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.material.update({
    where: { id, organizationId },
    data: parsed.data,
  });
  revalidatePath("/inventar/material");
  return { success: true };
}

export async function deleteMaterial(id: string) {
  const organizationId = await requireOrgId();
  await prisma.material.delete({ where: { id, organizationId } });
  revalidatePath("/inventar/material");
}
