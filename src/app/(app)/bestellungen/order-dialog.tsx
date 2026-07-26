"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
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
import { createOrder, updateOrder } from "./actions";

export type CustomerOption = { id: string; name: string };
export type ProductOption = {
  id: string;
  name: string;
  salePrice: number;
  stock: number;
  weightGrams: number;
};
export type CalculationOption = { id: string; label: string; sellingPrice: number };
export type ShippingOption = { id: string; name: string; cost: number };
export type MaterialOption = { id: string; name: string; unit: string };

type ItemRow = {
  kind: "product" | "calculation";
  productId: string;
  calculationId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
};

export type ExistingOrder = {
  id: string;
  customerId: string;
  note: string;
  shippingOptionId: string;
  couponCode: string;
  voucherCode: string;
  hasInvoice: boolean;
  items: {
    kind: "product" | "calculation";
    productId: string;
    calculationId: string;
    materialId: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export function OrderDialog({
  order,
  customers,
  products,
  calculations,
  shippingOptions,
  materials,
}: {
  order?: ExistingOrder;
  customers: CustomerOption[];
  products: ProductOption[];
  calculations: CalculationOption[];
  shippingOptions: ShippingOption[];
  materials: MaterialOption[];
}) {
  const isEdit = !!order;
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(order?.customerId ?? "");
  const [note, setNote] = useState(order?.note ?? "");
  const [items, setItems] = useState<ItemRow[]>(order?.items ?? []);
  const [shippingOptionId, setShippingOptionId] = useState(order?.shippingOptionId ?? "");
  const [couponCode, setCouponCode] = useState(order?.couponCode ?? "");
  const [voucherCode, setVoucherCode] = useState(order?.voucherCode ?? "");
  const [isPending, startTransition] = useTransition();

  const canAddItem = products.length > 0 || calculations.length > 0;

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items]
  );
  const shippingCost = shippingOptions.find((s) => s.id === shippingOptionId)?.cost ?? 0;

  const addItem = (kind: ItemRow["kind"]) => {
    if (kind === "product") {
      const firstUnused = products.find((p) => !items.some((i) => i.productId === p.id));
      const p = firstUnused ?? products[0];
      if (!p) return;
      setItems([
        ...items,
        { kind: "product", productId: p.id, calculationId: "", materialId: "", quantity: 1, unitPrice: p.salePrice },
      ]);
    } else {
      const c = calculations[0];
      if (!c) return;
      setItems([
        ...items,
        { kind: "calculation", productId: "", calculationId: c.id, materialId: "", quantity: 1, unitPrice: c.sellingPrice },
      ]);
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
          next.materialId = "";
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
    setNote("");
    setItems([]);
    setShippingOptionId("");
    setCouponCode("");
    setVoucherCode("");
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
    for (const item of items) {
      if (item.kind === "product") {
        const p = products.find((pr) => pr.id === item.productId);
        if (p && p.weightGrams > 0 && !item.materialId) {
          toast.error(`Bitte Material für „${p.name}“ auswählen`);
          return;
        }
      }
    }
    startTransition(async () => {
      const payload = {
        customerId,
        note,
        items: items.map((i) => ({
          productId: i.kind === "product" ? i.productId : undefined,
          calculationId: i.kind === "calculation" ? i.calculationId : undefined,
          materialId: i.materialId || undefined,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shippingOptionId: shippingOptionId || undefined,
        couponCode: couponCode || undefined,
        voucherCode: voucherCode || undefined,
      };
      const res = isEdit ? await updateOrder(order!.id, payload) : await createOrder(payload);
      if (res.success) {
        toast.success(isEdit ? "Bestellung aktualisiert" : "Bestellung angelegt");
        if (isEdit && order!.hasInvoice) {
          toast.info("Rechnung nicht automatisch aktualisiert – nutze „Rechnung aktualisieren“ in der Übersicht.");
        }
        if (!isEdit) reset();
        setOpen(false);
      } else {
        toast.error(res.error ?? "Fehler beim Speichern");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={isEdit ? <Button variant="ghost" size="icon-sm" /> : <Button className="gap-1.5" />}
      >
        {isEdit ? (
          <Pencil className="h-3.5 w-3.5" />
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Neue Bestellung
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Bestellung bearbeiten" : "Neue Bestellung"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {isEdit && order!.hasInvoice && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Für diese Bestellung existiert bereits eine Rechnung. Nach dem Speichern kannst du sie über
              „Rechnung aktualisieren“ auf der Rechnungen-Seite neu ausstellen.
            </p>
          )}
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
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => addItem("product")}
                  disabled={products.length === 0}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Produkt
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => addItem("calculation")}
                  disabled={calculations.length === 0}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Kalkulation
                </Button>
              </div>
            </div>
            {!canAddItem && (
              <p className="text-muted-foreground text-xs">
                Lege zuerst ein Produkt oder eine Kalkulation an.
              </p>
            )}
            {items.map((item, i) => {
              const selectedProduct =
                item.kind === "product" ? products.find((p) => p.id === item.productId) : undefined;
              const needsMaterial = !!selectedProduct && selectedProduct.weightGrams > 0;
              return (
                <div key={i} className="space-y-1.5 rounded-md border p-2">
                  <div className="flex items-center gap-2">
                    {item.kind === "product" ? (
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
                    ) : (
                      <NativeSelect
                        className="flex-1"
                        value={item.calculationId}
                        onChange={(e) => updateItem(i, { calculationId: e.target.value })}
                      >
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
                  {needsMaterial && (
                    <div className="flex items-center gap-2">
                      <Label className="text-muted-foreground shrink-0 text-xs">Material</Label>
                      <NativeSelect
                        className="flex-1"
                        value={item.materialId}
                        onChange={(e) => updateItem(i, { materialId: e.target.value })}
                      >
                        <option value="" disabled>
                          Material wählen
                        </option>
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="o-shipping">Versandart</Label>
              <NativeSelect
                id="o-shipping"
                value={shippingOptionId}
                onChange={(e) => setShippingOptionId(e.target.value)}
              >
                <option value="">Kein Versand</option>
                {shippingOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatCurrency(s.cost)})
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-coupon">Rabattcode (optional)</Label>
              <Input
                id="o-coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="z.B. FREUNDE10"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="o-voucher">Gutschein-Code einlösen (optional)</Label>
              <Input
                id="o-voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="z.B. GUT-AB12CD"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="o-note">Notiz (optional)</Label>
            <Textarea id="o-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Zwischensumme</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {shippingCost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Versand</span>
                <span>{formatCurrency(shippingCost)}</span>
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Rabatt/Gutschein werden beim Speichern serverseitig geprüft und in der Gesamtsumme berücksichtigt.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Speichern…" : isEdit ? "Änderungen speichern" : "Bestellung anlegen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
