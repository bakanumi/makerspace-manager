import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { fetchFilaments, filamentLabel, spoolmanEnabled, syncSpoolmanStock } from "@/lib/spoolman";
import { MaterialDialog } from "./material-dialog";
import { MaterialTable } from "./material-table";

export default async function MaterialPage() {
  const organizationId = await requireOrgId();
  await syncSpoolmanStock(organizationId);
  const materials = await prisma.material.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
  const spoolOptions = spoolmanEnabled(organizationId)
    ? ((await fetchFilaments()) ?? []).map((f) => ({ id: f.id, label: filamentLabel(f) }))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Material</h1>
          <p className="text-muted-foreground text-sm">Bestand, Preise und Lieferanten</p>
        </div>
        <MaterialDialog spoolOptions={spoolOptions} />
      </div>
      <MaterialTable
        spoolOptions={spoolOptions}
        materials={materials.map((m) => ({
          id: m.id,
          name: m.name,
          type: m.type,
          color: m.color ?? "",
          photoUrl: m.photoUrl ?? "",
          unit: m.unit,
          stock: Number(m.stock),
          minStock: Number(m.minStock),
          pricePerUnit: Number(m.pricePerUnit),
          spoolWeightGrams: m.spoolWeightGrams ? Number(m.spoolWeightGrams) : 0,
          spoolmanFilamentId: m.spoolmanFilamentId,
          supplier: m.supplier ?? "",
          note: m.note ?? "",
        }))}
      />
    </div>
  );
}
