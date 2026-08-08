"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { decimalNumber } from "@/lib/zod-decimal";

const emptyToNull = (v: unknown) => (v === "" ? null : v);
const optionalText = () => z.preprocess(emptyToNull, z.string().nullable());

const settingsSchema = z.object({
  name: z.string().min(2, "Firmenname ist zu kurz"),
  addressLine1: optionalText(),
  addressLine2: optionalText(),
  postalCode: optionalText(),
  city: optionalText(),
  country: z.string().min(1),
  email: z.preprocess(emptyToNull, z.string().email("Ungültige E-Mail").nullable()),
  phone: optionalText(),
  taxId: optionalText(),
  taxMode: z.enum(["KLEINUNTERNEHMER", "REGELBESTEUERUNG"]),
  vatRatePercent: decimalNumber.pipe(z.number().min(0).max(100)),
  electricityPricePerKwh: decimalNumber.pipe(z.number().min(0)),
  defaultHourlyRate: decimalNumber.pipe(z.number().min(0)),
  defaultMarginPercent: decimalNumber.pipe(z.number().min(0)),
  invoiceNumberPrefix: z.string().min(1),
  offerNumberPrefix: z.string().min(1),
  themeColor: z.enum(["blue", "green", "violet", "amber", "neutral"]),
  themeMode: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  pdfTemplate: z.enum(["STANDARD", "MODERN"]),
  logoUrl: z.preprocess(emptyToNull, z.string().url().nullable()),
  invoiceShowPhone: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  invoiceShowEmail: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  invoiceFooterText: optionalText(),
});

export type SettingsState = { error?: string; success?: boolean };

export async function updateSettings(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const organizationId = await requireOrgId();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: parsed.data,
  });

  revalidatePath("/einstellungen");
  return { success: true };
}
