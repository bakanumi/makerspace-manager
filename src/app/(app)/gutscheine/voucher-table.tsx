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
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteGiftVoucher } from "./actions";

export type VoucherRow = {
  id: string;
  code: string;
  initialValue: number;
  remainingValue: number;
  purchasedByName: string | null;
  issuedAt: string;
};

export function VoucherTable({ vouchers }: { vouchers: VoucherRow[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, code: string) => {
    if (!confirm(`Gutschein "${code}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteGiftVoucher(id);
        toast.success("Gutschein gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen");
      }
    });
  };

  if (vouchers.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Noch kein Wertgutschein verkauft.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead className="hidden sm:table-cell">Käufer</TableHead>
            <TableHead className="hidden md:table-cell">Datum</TableHead>
            <TableHead className="text-right">Wert</TableHead>
            <TableHead className="text-right">Restguthaben</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vouchers.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.code}</TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {v.purchasedByName ?? "–"}
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell text-xs">
                {formatDate(v.issuedAt)}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(v.initialValue)}</TableCell>
              <TableCell className="text-right">
                {v.remainingValue <= 0 ? (
                  <Badge variant="destructive">aufgebraucht</Badge>
                ) : (
                  formatCurrency(v.remainingValue)
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleDelete(v.id, v.code)}
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
