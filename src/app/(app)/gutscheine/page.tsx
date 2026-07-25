import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { CouponDialog } from "./coupon-dialog";
import { CouponTable } from "./coupon-table";
import { VoucherDialog } from "./voucher-dialog";
import { VoucherTable } from "./voucher-table";

export default async function GutscheinePage() {
  const organizationId = await requireOrgId();
  const [coupons, vouchers, customers] = await Promise.all([
    prisma.coupon.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
    prisma.giftVoucher.findMany({
      where: { organizationId },
      orderBy: { issuedAt: "desc" },
      include: { purchasedByCustomer: true },
    }),
    prisma.customer.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gutscheine</h1>
        <p className="text-muted-foreground text-sm">
          Rabattcodes für Bestellungen und verkaufbare Wertgutscheine
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rabattcodes</CardTitle>
          <CouponDialog />
        </CardHeader>
        <CardContent>
          <CouponTable
            coupons={coupons.map((c) => ({
              id: c.id,
              code: c.code,
              type: c.type,
              value: Number(c.value),
              validFrom: c.validFrom?.toISOString() ?? null,
              validUntil: c.validUntil?.toISOString() ?? null,
              maxUses: c.maxUses,
              usedCount: c.usedCount,
              active: c.active,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Wertgutscheine</CardTitle>
          <VoucherDialog customers={customers.map((c) => ({ id: c.id, name: c.name }))} />
        </CardHeader>
        <CardContent>
          <VoucherTable
            vouchers={vouchers.map((v) => ({
              id: v.id,
              code: v.code,
              initialValue: Number(v.initialValue),
              remainingValue: Number(v.remainingValue),
              purchasedByName: v.purchasedByCustomer?.name ?? null,
              issuedAt: v.issuedAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
