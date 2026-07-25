"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

function randomCode(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}-${suffix}`;
}

const couponSchema = z.object({
  code: z.string().min(2, "Code fehlt").toUpperCase(),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().min(0),
  validFrom: z.preprocess((v) => (v === "" ? null : v), z.coerce.date().nullable()),
  validUntil: z.preprocess((v) => (v === "" ? null : v), z.coerce.date().nullable()),
  maxUses: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1).nullable()),
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export type CouponState = { error?: string; success?: boolean };

export async function createCoupon(
  _prevState: CouponState,
  formData: FormData
): Promise<CouponState> {
  const organizationId = await requireOrgId();
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }
  try {
    await prisma.coupon.create({ data: { ...parsed.data, organizationId } });
  } catch {
    return { error: "Dieser Code existiert bereits" };
  }
  revalidatePath("/gutscheine");
  return { success: true };
}

export async function toggleCouponActive(id: string, active: boolean) {
  const organizationId = await requireOrgId();
  await prisma.coupon.update({ where: { id, organizationId }, data: { active } });
  revalidatePath("/gutscheine");
}

export async function deleteCoupon(id: string) {
  const organizationId = await requireOrgId();
  await prisma.coupon.delete({ where: { id, organizationId } });
  revalidatePath("/gutscheine");
}

const voucherSchema = z.object({
  initialValue: z.coerce.number().min(0.01, "Wert muss größer als 0 sein"),
  purchasedByCustomerId: z.preprocess((v) => (v === "" || v === "none" ? null : v), z.string().nullable()),
  note: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
});

export type VoucherState = { error?: string; success?: boolean; code?: string };

export async function createGiftVoucher(
  _prevState: VoucherState,
  formData: FormData
): Promise<VoucherState> {
  const organizationId = await requireOrgId();
  const parsed = voucherSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  let code = randomCode("GUT");
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.giftVoucher.findUnique({
      where: { organizationId_code: { organizationId, code } },
    });
    if (!existing) break;
    code = randomCode("GUT");
  }

  await prisma.giftVoucher.create({
    data: {
      organizationId,
      code,
      initialValue: parsed.data.initialValue,
      remainingValue: parsed.data.initialValue,
      purchasedByCustomerId: parsed.data.purchasedByCustomerId,
      note: parsed.data.note,
    },
  });

  revalidatePath("/gutscheine");
  return { success: true, code };
}

export async function deleteGiftVoucher(id: string) {
  const organizationId = await requireOrgId();
  await prisma.giftVoucher.delete({ where: { id, organizationId } });
  revalidatePath("/gutscheine");
}
