"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { createQuote } from "./actions";

export type CustomerOption = { id: string; name: string };
export type ProductOption = { id: string; name: string; salePrice: number };
export type CalculationOption = { id: string; label: string; sellingPrice: number };

type ItemRow = {
  kind: "product" | "calculation";
  productId: string;
  calculationId: string;
  quantity: number;
  unitPrice: number;
};

export function QuoteDialog({
  customers,
  products,
  calculations,
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  calculations: CalculationOption[];
}) {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validUntil, setValidUntil] = useState("");
  const [isPending, startTransition] = useTransition();

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items]
  );

  const addItem = (kind: ItemRow["kind"]) => {
    if (kind === "product") {
      const p = products.find((pr) => !items.some((i) => i.productId === pr.id)) ?? products[0];
      if (!p) return;
      setItems([...items, { kind: "product", productId: p.id, calculationId: "", quantity: 1, unitPrice: p.salePrice }]);
    } else {
      const c = calculations[0];
      if (!c) return;
      setItems([...items, { kind: "calculation", productId: "", calculationId: c.id, quantity: 1, unitPrice: c.sellingPrice }]);
    }
  };

  const updateItem = (index: number, patch: Partial<ItemRow>) => {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, ...patch };
        if (patch.productId) {
          const p = products.find((pr) => pr.id === patch.productId);
          if (p) next.unitPrice = p.salePrice;
        }
        if (patch.calculationId) {
          const c = calculations.find((cal) => cal.id === patch.calculationId);
          if (c) next.unitPrice = c.sellingPrice;
        }
        return next;
      })
    );
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const reset = () => {
    setCustomerId("");
    setItems([]);
    setDiscountAmount(0);
    setValidUntil("");
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
      const res = await createQuote({
        customerId,
        items: items.map((i) => ({
          productId: i.kind === "product" ? i.productId : undefined,
          calculationId: i.kind === "calculation" ? i.calculationId : undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discountAmount,
        validUntil: validUntil || undefined,
      });
      if (res.success) {
        toast.success("Angebot erstellt");
        reset();
        setOpen(false);
      } else {
        toast.error(res.error ?? "Fehler beim Erstellen");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Neues Angebot
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Neues Angebot</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="q-customer">Kunde</Label>
            <NativeSelect id="q-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
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
              <div className="flex gap-1.5">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addItem("product")} disabled={products.length === 0}>
                  <Plus className="h-3.5 w-3.5" />
                  Produkt
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addItem("calculation")} disabled={calculations.length === 0}>
                  <Plus className="h-3.5 w-3.5" />
                  Kalkulation
                </Button>
              </div>
            </div>
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                {item.kind === "product" ? (
                  <NativeSelect className="flex-1" value={item.productId} onChange={(e) => updateItem(i, { productId: e.target.value })}>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <NativeSelect className="flex-1" value={item.calculationId} onChange={(e) => updateItem(i, { calculationId: e.target.value })}>
                    {calculations.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </NativeSelect>
                )}
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="q-discount">Rabatt (€, optional)</Label>
              <Input
                id="q-discount"
                type="number"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-validUntil">Gültig bis (optional)</Label>
              <Input id="q-validUntil" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground text-sm">Gesamt</span>
            <span className="text-lg font-semibold">
              {formatCurrency(Math.max(0, subtotal - discountAmount))}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Speichern…" : "Angebot erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
