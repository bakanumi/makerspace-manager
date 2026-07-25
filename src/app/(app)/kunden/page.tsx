import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { CustomerDialog } from "./customer-dialog";
import { CustomerTable } from "./customer-table";

export default async function KundenPage() {
  const organizationId = await requireOrgId();
  const customers = await prisma.customer.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kunden</h1>
          <p className="text-muted-foreground text-sm">Kontaktdaten deiner Kundschaft</p>
        </div>
        <CustomerDialog />
      </div>
      <CustomerTable
        customers={customers.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email ?? "",
          phone: c.phone ?? "",
          addressLine1: c.addressLine1 ?? "",
          addressLine2: c.addressLine2 ?? "",
          postalCode: c.postalCode ?? "",
          city: c.city ?? "",
          country: c.country,
          note: c.note ?? "",
        }))}
      />
    </div>
  );
}
