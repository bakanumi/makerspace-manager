"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, ImageOff } from "lucide-react";
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
import { deleteProduct } from "./actions";
import { ProductDialog, type ProductFormValues, type CalculationOption } from "./product-dialog";

export function ProductTable({
  products,
  calculations,
}: {
  products: ProductFormValues[];
  calculations: CalculationOption[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast.success("Produkt gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen (wird es evtl. noch in Bestellungen verwendet?)");
      }
    });
  };

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Noch kein Produkt erfasst.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14" />
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Preis</TableHead>
            <TableHead className="text-right">Bestand</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.photoUrl}
                    alt={p.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                    <ImageOff className="text-muted-foreground h-4 w-4" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{p.name}</div>
                {p.description && (
                  <div className="text-muted-foreground line-clamp-1 text-xs">
                    {p.description}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(p.salePrice)}
              </TableCell>
              <TableCell className="text-right">
                {p.stock === 0 ? (
                  <Badge variant="destructive">ausverkauft</Badge>
                ) : (
                  p.stock
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <ProductDialog product={p} calculations={calculations} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(p.id, p.name)}
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
