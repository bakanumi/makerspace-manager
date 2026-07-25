"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { computeCalculation } from "@/lib/calculation";

const calculationInputSchema = z.object({
  name: z.string().optional(),
  deviceId: z.string().min(1),
  timeHours: z.number().min(0),
  laborHours: z.number().min(0),
  hourlyRate: z.number().min(0),
  electricityPrice: z.number().min(0),
  marginPercent: z.number().min(0),
  materialLines: z
    .array(z.object({ materialId: z.string().min(1), amount: z.number().min(0) }))
    .default([]),
});

export type SaveCalculationInput = z.infer<typeof calculationInputSchema>;
export type CalculationState = { error?: string; success?: boolean; id?: string };

export async function saveCalculation(
  input: SaveCalculationInput
): Promise<CalculationState> {
  const organizationId = await requireOrgId();
  const parsed = calculationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }
  const data = parsed.data;

  const device = await prisma.device.findUnique({
    where: { id: data.deviceId, organizationId },
  });
  if (!device) return { error: "Gerät nicht gefunden" };

  const materialIds = data.materialLines.map((l) => l.materialId);
  const materials = await prisma.material.findMany({
    where: { id: { in: materialIds }, organizationId },
  });
  const materialMap = new Map(materials.map((m) => [m.id, m]));

  for (const line of data.materialLines) {
    if (!materialMap.has(line.materialId)) {
      return { error: "Material nicht gefunden" };
    }
  }

  const result = computeCalculation({
    deviceWearFactor: Number(device.wearFactor),
    devicePowerConsumptionKw: Number(device.powerConsumptionKw),
    timeHours: data.timeHours,
    laborHours: data.laborHours,
    hourlyRate: data.hourlyRate,
    electricityPrice: data.electricityPrice,
    marginPercent: data.marginPercent,
    materialLines: data.materialLines.map((l) => ({
      amount: l.amount,
      pricePerUnit: Number(materialMap.get(l.materialId)!.pricePerUnit),
    })),
  });

  const calculation = await prisma.calculation.create({
    data: {
      organizationId,
      name: data.name || null,
      deviceId: data.deviceId,
      timeHours: data.timeHours,
      laborHours: data.laborHours,
      hourlyRate: data.hourlyRate,
      electricityPrice: data.electricityPrice,
      marginPercent: data.marginPercent,
      materialCost: result.materialCost,
      electricityCost: result.electricityCost,
      wearCost: result.wearCost,
      laborCost: result.laborCost,
      costPrice: result.costPrice,
      sellingPrice: result.sellingPrice,
      materialLines: {
        create: data.materialLines.map((l, i) => ({
          materialId: l.materialId,
          amount: l.amount,
          cost: result.materialLineCosts[i],
        })),
      },
    },
  });

  revalidatePath("/kalkulator");
  return { success: true, id: calculation.id };
}

export async function deleteCalculation(id: string) {
  const organizationId = await requireOrgId();
  await prisma.calculation.delete({ where: { id, organizationId } });
  revalidatePath("/kalkulator");
}
