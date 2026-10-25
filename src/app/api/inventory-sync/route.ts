import { prisma } from "@/lib/prisma";
import { requireInventorySync, syncErrorResponse } from "@/lib/inventory-sync";

/** Verbindungstest für die Inventur-App */
export async function GET(request: Request) {
  try {
    const org = await requireInventorySync(request);
    const linkedMaterials = await prisma.material.count({
      where: { organizationId: org.id, inventoryItemId: { not: null } },
    });
    return Response.json({ ok: true, organization: org.name, linkedMaterials });
  } catch (error) {
    return syncErrorResponse(error);
  }
}
