import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { ProductDialog } from "./product-dialog";
import { ProductTable } from "./product-table";

export default async function ProduktePage() {
  const organizationId = await requireOrgId();
  const [products, calculations] = await Promise.all([
    prisma.product.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.calculation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { device: true },
      take: 50,
    }),
  ]);

  const calculationOptions = calculations.map((c) => ({
    id: c.id,
    label: `${c.name || c.device.name} – ${c.createdAt.toLocaleDateString("de-DE")}`,
    sellingPrice: Number(c.sellingPrice),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produkte</h1>
          <p className="text-muted-foreground text-sm">
            Produkte, Verkaufspreise und Lagerbestand
          </p>
        </div>
        <ProductDialog calculations={calculationOptions} />
      </div>
      <ProductTable
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? "",
          photoUrl: p.photoUrl ?? "",
          calculationId: p.calculationId ?? "",
          salePrice: Number(p.salePrice),
          stock: p.stock,
        }))}
        calculations={calculationOptions}
      />
    </div>
  );
}
