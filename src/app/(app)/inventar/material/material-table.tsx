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
import { formatNumber, formatUnitPrice } from "@/lib/format";
import { deleteMaterial } from "./actions";
import { MaterialDialog, type MaterialFormValues } from "./material-dialog";

const unitLabel: Record<MaterialFormValues["unit"], string> = {
  GRAMM: "g",
  MILLILITER: "ml",
  STUECK: "Stk",
  METER: "m",
};

export function MaterialTable({ materials }: { materials: MaterialFormValues[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteMaterial(id);
        toast.success("Material gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen (wird es evtl. noch verwendet?)");
      }
    });
  };

  if (materials.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Noch kein Material erfasst.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Farbe</TableHead>
            <TableHead className="text-right">Bestand</TableHead>
            <TableHead className="text-right">Preis/Einheit</TableHead>
            <TableHead>Lieferant</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((m) => {
            const low = m.stock <= m.minStock;
            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {m.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photoUrl} alt={m.name} className="h-8 w-8 rounded object-cover" />
                    )}
                    {m.name}
                  </div>
                </TableCell>
                <TableCell>{m.type}</TableCell>
                <TableCell className="text-muted-foreground">{m.color || "–"}</TableCell>
                <TableCell className="text-right">
                  <span className={low ? "text-destructive font-medium" : ""}>
                    {formatNumber(m.stock)} {unitLabel[m.unit]}
                  </span>
                  {low && (
                    <Badge variant="destructive" className="ml-2">
                      niedrig
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatUnitPrice(m.pricePerUnit)}/{unitLabel[m.unit]}
                </TableCell>
                <TableCell className="text-muted-foreground">{m.supplier || "–"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <MaterialDialog material={m} />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleDelete(m.id, m.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
