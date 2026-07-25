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
import { deleteCalculation } from "./actions";

export type CalculationHistoryItem = {
  id: string;
  name: string | null;
  deviceName: string;
  createdAt: string;
  costPrice: number;
  sellingPrice: number;
};

export function CalculationHistory({ items }: { items: CalculationHistoryItem[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteCalculation(id);
      toast.success("Kalkulation gelöscht");
    });
  };

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Noch keine Kalkulationen gespeichert.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bezeichnung</TableHead>
            <TableHead className="hidden sm:table-cell">Gerät</TableHead>
            <TableHead className="hidden sm:table-cell">Datum</TableHead>
            <TableHead className="hidden md:table-cell text-right">Selbstkosten</TableHead>
            <TableHead className="text-right">Verkaufspreis</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name || "–"}</TableCell>
              <TableCell className="hidden sm:table-cell">{c.deviceName}</TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {formatDate(c.createdAt)}
              </TableCell>
              <TableCell className="hidden md:table-cell text-right">
                {formatCurrency(c.costPrice)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(c.sellingPrice)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleDelete(c.id)}
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
