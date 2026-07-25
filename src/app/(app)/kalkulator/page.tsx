import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { CalculatorForm } from "./calculator-form";
import { CalculationHistory } from "./calculation-history";

export default async function KalkulatorPage() {
  const organizationId = await requireOrgId();

  const [org, devices, materials, calculations] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    prisma.device.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.material.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.calculation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { device: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kalkulator</h1>
        <p className="text-muted-foreground text-sm">
          Selbstkosten und Verkaufspreis inkl. Verschleiß und Stromkosten berechnen
        </p>
      </div>

      <CalculatorForm
        devices={devices.map((d) => ({
          id: d.id,
          name: d.name,
          purchasePrice: Number(d.purchasePrice),
          powerConsumptionKw: Number(d.powerConsumptionKw),
          expectedLifetimeHours: Number(d.expectedLifetimeHours),
        }))}
        materials={materials.map((m) => ({
          id: m.id,
          name: m.name,
          unit: m.unit,
          pricePerUnit: Number(m.pricePerUnit),
        }))}
        defaults={{
          electricityPrice: Number(org.electricityPricePerKwh),
          hourlyRate: Number(org.defaultHourlyRate),
          marginPercent: Number(org.defaultMarginPercent),
        }}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Verlauf</h2>
        <CalculationHistory
          items={calculations.map((c) => ({
            id: c.id,
            name: c.name,
            deviceName: c.device.name,
            createdAt: c.createdAt.toISOString(),
            costPrice: Number(c.costPrice),
            sellingPrice: Number(c.sellingPrice),
          }))}
        />
      </div>
    </div>
  );
}
