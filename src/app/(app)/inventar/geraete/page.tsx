import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { DeviceDialog } from "./device-dialog";
import { DeviceTable } from "./device-table";

export default async function GeraetePage() {
  const organizationId = await requireOrgId();
  const devices = await prisma.device.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Geräte</h1>
          <p className="text-muted-foreground text-sm">
            3D-Drucker & Lasergravierer inkl. Verschleiß-Basisdaten
          </p>
        </div>
        <DeviceDialog />
      </div>
      <DeviceTable
        devices={devices.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          purchasePrice: Number(d.purchasePrice),
          powerConsumptionKw: Number(d.powerConsumptionKw),
          expectedLifetimeHours: Number(d.expectedLifetimeHours),
          operatingHours: Number(d.operatingHours),
          wearFactor: Number(d.wearFactor),
          maintenanceNote: d.maintenanceNote ?? "",
        }))}
      />
    </div>
  );
}
