import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { OrderDialog } from "./order-dialog";
import { OrderTable } from "./order-table";

export default async function BestellungenPage() {
  const organizationId = await requireOrgId();
  const [orders, customers, products] = await Promise.all([
    prisma.order.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    }),
    prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bestellungen</h1>
          <p className="text-muted-foreground text-sm">
            Kundenbestellungen mit automatischem Lagerabzug
          </p>
        </div>
        <OrderDialog
          customers={customers.map((c) => ({ id: c.id, name: c.name }))}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            salePrice: Number(p.salePrice),
            stock: p.stock,
          }))}
        />
      </div>
      <OrderTable
        orders={orders.map((o) => ({
          id: o.id,
          customerName: o.customer.name,
          createdAt: o.createdAt.toISOString(),
          status: o.status,
          itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
          total: o.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
        }))}
      />
    </div>
  );
}
