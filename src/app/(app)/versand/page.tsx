import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { ShippingDialog } from "./shipping-dialog";
import { ShippingTable } from "./shipping-table";

export default async function VersandPage() {
  const organizationId = await requireOrgId();
  const options = await prisma.shippingOption.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Versand</h1>
          <p className="text-muted-foreground text-sm">
            Verpackungsgrößen, Versanddienstleister und Kosten
          </p>
        </div>
        <ShippingDialog />
      </div>
      <ShippingTable
        options={options.map((o) => ({
          id: o.id,
          name: o.name,
          carrier: o.carrier,
          cost: Number(o.cost),
        }))}
      />
    </div>
  );
}
