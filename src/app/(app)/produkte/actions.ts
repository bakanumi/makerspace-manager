"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { decimalNumber } from "@/lib/zod-decimal";

const productSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  description: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
  photoUrl: z.preprocess((v) => (v === "" ? null : v), z.string().url().nullable()),
  calculationId: z.preprocess((v) => (v === "" || v === "none" ? null : v), z.string().nullable()),
  salePrice: decimalNumber.pipe(z.number().min(0)),
  stock: decimalNumber.pipe(z.number().int().min(0)),
  weightGrams: z.preprocess(
    (v) => {
      if (v === "" || v === undefined || v === null) return null;
      return typeof v === "string" ? v.replace(",", ".") : v;
    },
    z.coerce.number().min(0).nullable()
  ),
});

export type ProductState = { error?: string; success?: boolean };

export async function createProduct(
  _prevState: ProductState,
  formData: FormData
): Promise<ProductState> {
  const organizationId = await requireOrgId();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.product.create({ data: { ...parsed.data, organizationId } });
  revalidatePath("/produkte");
  return { success: true };
}

export async function updateProduct(
  _prevState: ProductState,
  formData: FormData
): Promise<ProductState> {
  const organizationId = await requireOrgId();
  const id = formData.get("id") as string;
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.product.update({
    where: { id, organizationId },
    data: parsed.data,
  });
  revalidatePath("/produkte");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const organizationId = await requireOrgId();
  await prisma.product.delete({ where: { id, organizationId } });
  revalidatePath("/produkte");
}
