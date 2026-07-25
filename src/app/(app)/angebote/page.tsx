import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { QuoteDialog } from "./quote-dialog";
import { QuoteTable } from "./quote-table";

export default async function AngebotePage() {
  const organizationId = await requireOrgId();
  const [quotes, customers, products, calculations] = await Promise.all([
    prisma.quote.findMany({
      where: { organizationId },
      orderBy: { issuedAt: "desc" },
      include: { customer: true, items: true },
    }),
    prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.calculation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { device: true },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Angebote</h1>
          <p className="text-muted-foreground text-sm">
            Angebote erstellen, verfolgen und als PDF versenden
          </p>
        </div>
        <QuoteDialog
          customers={customers.map((c) => ({ id: c.id, name: c.name }))}
          products={products.map((p) => ({ id: p.id, name: p.name, salePrice: Number(p.salePrice) }))}
          calculations={calculations.map((c) => ({
            id: c.id,
            label: `${c.name || c.device.name} – ${c.createdAt.toLocaleDateString("de-DE")}`,
            sellingPrice: Number(c.sellingPrice),
          }))}
        />
      </div>
      <QuoteTable
        quotes={quotes.map((q) => {
          const itemsTotal = q.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
          return {
            id: q.id,
            number: q.number,
            customerName: q.customer.name,
            issuedAt: q.issuedAt.toISOString(),
            status: q.status,
            total: Math.max(0, itemsTotal - Number(q.discountAmount)),
          };
        })}
      />
    </div>
  );
}
