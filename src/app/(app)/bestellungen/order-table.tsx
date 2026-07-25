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

export type OrderRow = {
  id: string;
  customerName: string;
  createdAt: string;
  status: "OFFEN" | "IN_ARBEIT" | "FERTIG" | "VERSENDET" | "BEZAHLT" | "STORNIERT";
  itemCount: number;
  total: number;
};

export function OrderTable({ orders }: { orders: OrderRow[] }) {
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
            <TableHead>Datum</TableHead>
            <TableHead>Positionen</TableHead>
            <TableHead className="text-right">Gesamt</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.customerName}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
              <TableCell>{o.itemCount}</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(o.total)}</TableCell>
              <TableCell>
                <StatusSelect orderId={o.id} status={o.status} />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleDelete(o.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
