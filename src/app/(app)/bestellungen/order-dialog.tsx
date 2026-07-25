"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { createOrder } from "./actions";

export type CustomerOption = { id: string; name: string };
export type ProductOption = { id: string; name: string; salePrice: number; stock: number };

export function OrderDialog({
  customers,
  products,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
}) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([]);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items]
  );

  const addItem = () => {
    const firstUnused = products.find((p) => !items.some((i) => i.productId === p.id));
    const p = firstUnused ?? products[0];
    if (!p) return;
    setItems([...items, { productId: p.id, quantity: 1, unitPrice: p.salePrice }]);
  };

  const updateItem = (
    index: number,
    patch: Partial<{ productId: string; quantity: number; unitPrice: number }>
  ) => {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if (patch.productId) {
          const p = products.find((pr) => pr.id === patch.productId);
          if (p) next.unitPrice = p.salePrice;
        }
        return next;
      })
    );
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const reset = () => {
    setCustomerId("");
    setNote("");
    setItems([]);
  };

  const handleSubmit = () => {
    if (!customerId) {
      toast.error("Bitte einen Kunden auswählen");
      return;
    }
    if (items.length === 0) {
      toast.error("Bitte mindestens eine Position hinzufügen");
      return;
    }
    startTransition(async () => {
      const res = await createOrder({ customerId, note, items });
      if (res.success) {
        toast.success("Bestellung angelegt");
        reset();
        setOpen(false);
      } else {
        toast.error(res.error ?? "Fehler beim Anlegen");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Neue Bestellung
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neue Bestellung</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="o-customer">Kunde</Label>
            <NativeSelect
              id="o-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="" disabled>
                Kunde wählen
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Positionen</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={addItem}
                disabled={products.length === 0}
              >
                <Plus className="h-3.5 w-3.5" />
                Position hinzufügen
              </Button>
            </div>
            {products.length === 0 && (
              <p className="text-muted-foreground text-xs">
                Lege zuerst ein Produkt unter Produkte an.
              </p>
            )}
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <NativeSelect
                  className="flex-1"
                  value={item.productId}
                  onChange={(e) => updateItem(i, { productId: e.target.value })}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} auf Lager)
                    </option>
                  ))}
                </NativeSelect>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  className="w-16"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })}
                />
                <Input
                  type="number"
                  step="0.01"
                  className="w-24"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) || 0 })}
                />
                <Button variant="ghost" size="icon-sm" onClick={() => removeItem(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="o-note">Notiz (optional)</Label>
            <Textarea id="o-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground text-sm">Gesamt</span>
            <span className="text-lg font-semibold">{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Speichern…" : "Bestellung anlegen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
