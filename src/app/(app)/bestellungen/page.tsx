import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { OrderDialog } from "./order-dialog";
import { OrderTable } from "./order-table";

export default async function BestellungenPage() {
  const organizationId = await requireOrgId();
  const [orders, customers, products, calculations, shippingOptions] = await Promise.all([
    prisma.order.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true, voucherRedemptions: true },
    }),
    prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
    prisma.calculation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { device: true },
      take: 50,
    }),
    prisma.shippingOption.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
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
          calculations={calculations.map((c) => ({
            id: c.id,
            label: `${c.name || c.device.name} – ${c.createdAt.toLocaleDateString("de-DE")}`,
            sellingPrice: Number(c.sellingPrice),
          }))}
          shippingOptions={shippingOptions.map((s) => ({
            id: s.id,
            name: s.name,
            cost: Number(s.cost),
          }))}
        />
      </div>
      <OrderTable
        orders={orders.map((o) => {
          const itemsTotal = o.items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0);
          const voucherTotal = o.voucherRedemptions.reduce((sum, r) => sum + Number(r.amount), 0);
          const total = Math.max(0, itemsTotal - Number(o.discountAmount) + Number(o.shippingCost) - voucherTotal);
          return {
            id: o.id,
            customerName: o.customer.name,
            createdAt: o.createdAt.toISOString(),
            status: o.status,
            itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
            total,
          };
        })}
      />
    </div>
  );
}
