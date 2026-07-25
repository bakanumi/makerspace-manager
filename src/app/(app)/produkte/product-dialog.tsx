"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ImageUpload } from "@/components/image-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { createProduct, updateProduct } from "./actions";

export type ProductFormValues = {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  calculationId: string;
  salePrice: number;
  stock: number;
};

export type CalculationOption = {
  id: string;
  label: string;
  sellingPrice: number;
};

const emptyProduct: Omit<ProductFormValues, "id"> = {
  name: "",
  description: "",
  photoUrl: "",
  calculationId: "",
  salePrice: 0,
  stock: 0,
};

export function ProductDialog({
  product,
  calculations,
}: {
  product?: ProductFormValues;
  calculations: CalculationOption[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = product ?? emptyProduct;
  const [salePrice, setSalePrice] = useState(values.salePrice);
  const [calculationId, setCalculationId] = useState(values.calculationId || "none");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const action = product ? updateProduct : createProduct;
    startTransition(async () => {
      const res = await action({}, formData);
      if (res.success) {
        toast.success(product ? "Produkt aktualisiert" : "Produkt angelegt");
        setOpen(false);
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  const handleCalculationChange = (id: string) => {
    setCalculationId(id);
    const calc = calculations.find((c) => c.id === id);
    if (calc) setSalePrice(Math.round(calc.sellingPrice * 100) / 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          product ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button className="gap-1.5" />
          )
        }
      >
        {product ? <Pencil className="h-3.5 w-3.5" /> : (
          <>
            <Plus className="h-4 w-4" />
            Neues Produkt
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product ? "Produkt bearbeiten" : "Neues Produkt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {product && <input type="hidden" name="id" value={product.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" name="name" defaultValue={values.name} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-description">Beschreibung</Label>
              <Textarea id="p-description" name="description" defaultValue={values.description} rows={2} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-photoUrl">Foto (optional)</Label>
              <ImageUpload id="p-photoUrl" name="photoUrl" defaultValue={values.photoUrl} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="p-calculationId">Basiert auf Kalkulation</Label>
              <NativeSelect
                id="p-calculationId"
                name="calculationId"
                value={calculationId}
                onChange={(e) => handleCalculationChange(e.target.value)}
              >
                <option value="none">Keine</option>
                {calculations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({formatCurrency(c.sellingPrice)})
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-salePrice">Verkaufspreis (€)</Label>
              <Input
                id="p-salePrice"
                name="salePrice"
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-stock">Lagerbestand (Stk)</Label>
              <Input id="p-stock" name="stock" type="number" step="1" defaultValue={values.stock} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Speichern…" : "Speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
