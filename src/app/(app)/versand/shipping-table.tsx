"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { deleteShippingOption } from "./actions";
import { ShippingDialog, type ShippingFormValues } from "./shipping-dialog";

export const carrierLabel: Record<ShippingFormValues["carrier"], string> = {
  DHL: "DHL",
  HERMES: "Hermes",
  DPD: "DPD",
  POST: "Deutsche Post",
  SONSTIGE: "Sonstige",
};

export function ShippingTable({ options }: { options: ShippingFormValues[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteShippingOption(id);
        toast.success("Versandart gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen (wird sie evtl. noch verwendet?)");
      }
    });
  };

  if (options.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Noch keine Versandart erfasst.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bezeichnung</TableHead>
            <TableHead className="hidden sm:table-cell">Dienstleister</TableHead>
            <TableHead className="text-right">Kosten</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.name}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary">{carrierLabel[o.carrier]}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(o.cost)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <ShippingDialog option={o} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(o.id, o.name)}
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
