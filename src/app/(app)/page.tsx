import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { formatCurrency } from "@/lib/format";
import { Boxes, Printer, ClipboardList, Package } from "lucide-react";

export default async function DashboardPage() {
  const organizationId = await requireOrgId();

  const [materialCount, deviceCount, lowStockMaterials, openOrders, productCount, orderValue] =
    await Promise.all([
      prisma.material.count({ where: { organizationId } }),
      prisma.device.count({ where: { organizationId } }),
      prisma.material.findMany({
        where: { organizationId },
        select: { id: true, name: true, stock: true, minStock: true, unit: true },
      }).then((materials) => materials.filter((m) => Number(m.stock) <= Number(m.minStock))),
      prisma.order.count({
        where: { organizationId, status: { in: ["OFFEN", "IN_ARBEIT"] } },
      }),
      prisma.product.count({ where: { organizationId } }),
      prisma.order.findMany({
        where: { organizationId, status: { not: "STORNIERT" } },
        include: { items: true },
      }).then((orders) =>
        orders.reduce(
          (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0),
          0
        )
      ),
    ]);

  const stats = [
    { label: "Material-Sorten", value: materialCount, icon: Boxes, href: "/inventar/material" },
    { label: "Geräte", value: deviceCount, icon: Printer, href: "/inventar/geraete" },
    { label: "Produkte", value: productCount, icon: Package, href: "/produkte" },
    { label: "Offene Bestellungen", value: openOrders, icon: ClipboardList, href: "/bestellungen" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Überblick über dein Business</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gesamtwert offener/laufender Bestellungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(orderValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bestand niedrig</CardTitle>
          </CardHeader>
          <CardContent>
            {materialCount === 0 ? (
              <p className="text-muted-foreground text-sm">Noch kein Material erfasst.</p>
            ) : lowStockMaterials.length === 0 ? (
              <p className="text-muted-foreground text-sm">Alle Materialbestände im grünen Bereich.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {lowStockMaterials.map((m) => (
                  <li key={m.id} className="flex justify-between">
                    <span>{m.name}</span>
                    <span className="text-destructive">
                      {Number(m.stock)} / {Number(m.minStock)} {m.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
