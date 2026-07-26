"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteOrder } from "./actions";
import { StatusSelect } from "./status-select";
import {
  OrderDialog,
  type CustomerOption,
  type ProductOption,
  type CalculationOption,
  type ShippingOption,
  type MaterialOption,
  type ExistingOrder,
} from "./order-dialog";

export type OrderRow = {
  id: string;
  customerName: string;
  createdAt: string;
  status: "OFFEN" | "IN_ARBEIT" | "FERTIG" | "VERSENDET" | "BEZAHLT" | "STORNIERT";
  itemCount: number;
  total: number;
  editData: ExistingOrder;
};

export function OrderTable({
  orders,
  customers,
  products,
  calculations,
  shippingOptions,
  materials,
}: {
  orders: OrderRow[];
  customers: CustomerOption[];
  products: ProductOption[];
  calculations: CalculationOption[];
  shippingOptions: ShippingOption[];
  materials: MaterialOption[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (!confirm("Bestellung wirklich löschen? Lagerbestand wird ggf. zurückgebucht.")) return;
    startTransition(async () => {
      try {
        await deleteOrder(id);
        toast.success("Bestellung gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen");
      }
    });
  };

  if (orders.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Noch keine Bestellung erfasst.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kunde</TableHead>
            <TableHead className="hidden sm:table-cell">Datum</TableHead>
            <TableHead className="hidden sm:table-cell">Positionen</TableHead>
            <TableHead className="text-right">Gesamt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium whitespace-normal sm:whitespace-nowrap">
                {o.customerName}
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {formatDate(o.createdAt)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">{o.itemCount}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(o.total)}</TableCell>
              <TableCell>
                <StatusSelect orderId={o.id} status={o.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <OrderDialog
                    order={o.editData}
                    customers={customers}
                    products={products}
                    calculations={calculations}
                    shippingOptions={shippingOptions}
                    materials={materials}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(o.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
