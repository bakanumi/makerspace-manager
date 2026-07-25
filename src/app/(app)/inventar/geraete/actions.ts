"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";

const deviceSchema = z.object({
  name: z.string().min(1, "Name fehlt"),
  type: z.enum(["DRUCKER_3D", "LASERGRAVUR"]),
  purchasePrice: z.coerce.number().min(0),
  powerConsumptionKw: z.coerce.number().min(0),
  expectedLifetimeHours: z.coerce.number().min(0.1),
  operatingHours: z.coerce.number().min(0),
  wearFactor: z.coerce.number().min(0),
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
