"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { decimalNumber } from "@/lib/zod-decimal";

const deviceSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  type: z.enum(["DRUCKER_3D", "LASERGRAVUR"]),
  purchasePrice: decimalNumber.pipe(z.number().min(0).max(99999999.99, "Anschaffungspreis ist zu hoch")),
  powerConsumptionKw: decimalNumber.pipe(
    z
      .number()
      .min(0)
      .max(999.999, "Leistung ist zu hoch – bitte in Kilowatt angeben, nicht Watt (z.B. 2.2 statt 2200)")
  ),
  expectedLifetimeHours: decimalNumber.pipe(z.number().min(0.1).max(999999999.9, "Lebensdauer ist zu hoch")),
  operatingHours: decimalNumber.pipe(z.number().min(0).max(999999999.9, "Betriebsstunden sind zu hoch")),
  wearFactor: decimalNumber.pipe(z.number().min(0).max(999999.9999, "Verschleißfaktor ist zu hoch")),
  maintenanceNote: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
});

export type DeviceState = { error?: string; success?: boolean };

export async function createDevice(
  _prevState: DeviceState,
  formData: FormData
): Promise<DeviceState> {
  const organizationId = await requireOrgId();
  const parsed = deviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.device.create({ data: { ...parsed.data, organizationId } });
  revalidatePath("/inventar/geraete");
  return { success: true };
}

export async function updateDevice(
  _prevState: DeviceState,
  formData: FormData
): Promise<DeviceState> {
  const organizationId = await requireOrgId();
  const id = formData.get("id") as string;
  const parsed = deviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  await prisma.device.update({
    where: { id, organizationId },
    data: parsed.data,
  });
  revalidatePath("/inventar/geraete");
  return { success: true };
}

export async function deleteDevice(id: string) {
  const organizationId = await requireOrgId();
  await prisma.device.delete({ where: { id, organizationId } });
  revalidatePath("/inventar/geraete");
}
