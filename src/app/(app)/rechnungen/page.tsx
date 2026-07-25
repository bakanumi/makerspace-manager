import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { NewInvoiceButton } from "./new-invoice-button";
import { CorrectionInvoiceButton } from "./correction-invoice-button";

export default async function RechnungenPage() {
  const organizationId = await requireOrgId();

  const [invoices, openOrders] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId },
      orderBy: { issuedAt: "desc" },
      include: { order: { include: { customer: true } }, correction: true },
    }),
    prisma.order.findMany({
      where: {
        organizationId,
        status: { not: "STORNIERT" },
        invoices: { none: { correctsInvoiceId: null } },
      },
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true, voucherRedemptions: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rechnungen</h1>
        <p className="text-muted-foreground text-sm">
          Rechnungen aus Bestellungen erstellen und herunterladen
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bestellungen ohne Rechnung</CardTitle>
        </CardHeader>
        <CardContent>
          {openOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Alle Bestellungen sind abgerechnet.
            </p>
          ) : (
            <div className="space-y-2">
              {openOrders.map((o) => {
                const itemsTotal = o.items.reduce(
                  (sum, i) => sum + Number(i.unitPrice) * i.quantity,
                  0
                );
                const voucherTotal = o.voucherRedemptions.reduce((sum, r) => sum + Number(r.amount), 0);
                const total = Math.max(
                  0,
                  itemsTotal - Number(o.discountAmount) + Number(o.shippingCost) - voucherTotal
                );
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="font-medium">{o.customer.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {formatDate(o.createdAt)} · {formatCurrency(total)}
                      </div>
                    </div>
                    <NewInvoiceButton orderId={o.id} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Verlauf</h2>
        {invoices.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Noch keine Rechnung erstellt.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nummer</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.number}
                      {inv.correctsInvoiceId && (
                        <Badge variant="secondary" className="ml-2">
                          Korrektur
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{inv.order.customer.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(inv.issuedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(inv.totalGross))}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {!inv.correctsInvoiceId && !inv.correction && (
                          <CorrectionInvoiceButton invoiceId={inv.id} />
                        )}
                        <Link
                          href={`/rechnungen/${inv.id}/pdf`}
                          target="_blank"
                          className="text-muted-foreground hover:text-foreground flex items-center px-2"
                        >
                          <Download className="h-4 w-4" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
