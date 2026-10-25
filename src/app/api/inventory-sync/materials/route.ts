import { prisma } from "@/lib/prisma";
import { requireInventorySync, syncErrorResponse } from "@/lib/inventory-sync";

/**
 * Aktueller Bestand aller aus der Inventur verknüpften Materialien. Die
 * Inventur-App erkennt daran Verbrauch, der hier gebucht wurde (Lagerabzug bei
 * fertigen Bestellungen, manuelle Korrekturen).
 */
export async function GET(request: Request) {
  try {
    const org = await requireInventorySync(request);
    const materials = await prisma.material.findMany({
      where: { organizationId: org.id, inventoryItemId: { not: null } },
      select: { id: true, inventoryItemId: true, stock: true, unit: true, updatedAt: true },
    });
    return Response.json({
      materials: materials.map((m) => ({
        id: m.id,
        externalId: m.inventoryItemId,
        stock: Number(m.stock),
        unit: m.unit,
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return syncErrorResponse(error);
  }
}
