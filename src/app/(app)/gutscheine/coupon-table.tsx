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
import { deleteCoupon, toggleCouponActive } from "./actions";

export type CouponRow = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
};

export function CouponTable({ coupons }: { coupons: CouponRow[] }) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      await toggleCouponActive(id, active);
      toast.success(active ? "Rabattcode aktiviert" : "Rabattcode deaktiviert");
    });
  };

  const handleDelete = (id: string, code: string) => {
    if (!confirm(`Code "${code}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteCoupon(id);
        toast.success("Rabattcode gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen");
      }
    });
  };

  if (coupons.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Noch kein Rabattcode angelegt.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Rabatt</TableHead>
            <TableHead className="hidden sm:table-cell">Gültigkeit</TableHead>
            <TableHead className="hidden sm:table-cell">Nutzungen</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.code}</TableCell>
              <TableCell>
                {c.type === "PERCENT" ? `${c.value}%` : formatCurrency(c.value)}
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell text-xs">
                {c.validFrom ? formatDate(c.validFrom) : "–"} bis{" "}
                {c.validUntil ? formatDate(c.validUntil) : "–"}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {c.usedCount}
                {c.maxUses ? ` / ${c.maxUses}` : ""}
              </TableCell>
              <TableCell>
                <button onClick={() => handleToggle(c.id, !c.active)} disabled={isPending}>
                  <Badge variant={c.active ? "secondary" : "destructive"}>
                    {c.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </button>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleDelete(c.id, c.code)}
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
