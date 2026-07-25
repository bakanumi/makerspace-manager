"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
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
import { createMaterial, updateMaterial } from "./actions";

export type MaterialFormValues = {
  id: string;
  name: string;
  type: string;
  color: string;
  photoUrl: string;
  unit: "GRAMM" | "MILLILITER" | "STUECK" | "METER";
  stock: number;
  minStock: number;
  pricePerUnit: number;
  spoolWeightGrams: number;
  supplier: string;
  note: string;
};

const emptyMaterial: Omit<MaterialFormValues, "id"> = {
  name: "",
  type: "",
  color: "",
  photoUrl: "",
  unit: "GRAMM",
  stock: 0,
  minStock: 0,
  pricePerUnit: 0,
  spoolWeightGrams: 0,
  supplier: "",
  note: "",
};

export function MaterialDialog({ material }: { material?: MaterialFormValues }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = material ?? emptyMaterial;
  const [unit, setUnit] = useState(values.unit);
  const [spoolWeightGrams, setSpoolWeightGrams] = useState(values.spoolWeightGrams || 0);
  const [stock, setStock] = useState(values.stock);
  const [spoolCount, setSpoolCount] = useState(
    spoolWeightGrams > 0 ? Math.round((values.stock / spoolWeightGrams) * 100) / 100 : 0
  );

  const handleSpoolCountChange = (count: number) => {
    setSpoolCount(count);
    if (spoolWeightGrams > 0) setStock(Math.round(count * spoolWeightGrams * 1000) / 1000);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const action = material ? updateMaterial : createMaterial;
    startTransition(async () => {
      const res = await action({}, formData);
      if (res.success) {
        toast.success(material ? "Material aktualisiert" : "Material angelegt");
        setOpen(false);
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          material ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button className="gap-1.5" />
          )
        }
      >
        {material ? <Pencil className="h-3.5 w-3.5" /> : (
          <>
            <Plus className="h-4 w-4" />
            Neues Material
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{material ? "Material bearbeiten" : "Neues Material"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {material && <input type="hidden" name="id" value={material.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-name">Name</Label>
              <Input id="m-name" name="name" defaultValue={values.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-type">Typ</Label>
              <Input id="m-type" name="type" defaultValue={values.type} placeholder="z.B. PLA, Resin, Holz" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-color">Farbe</Label>
              <Input id="m-color" name="color" defaultValue={values.color} placeholder="z.B. Schwarz" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-unit">Einheit</Label>
              <NativeSelect
                id="m-unit"
                name="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as MaterialFormValues["unit"])}
              >
                <option value="GRAMM">Gramm</option>
                <option value="MILLILITER">Milliliter</option>
                <option value="STUECK">Stück</option>
                <option value="METER">Meter</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-pricePerUnit">Preis pro Einheit (€)</Label>
              <Input id="m-pricePerUnit" name="pricePerUnit" type="number" step="0.0001" defaultValue={values.pricePerUnit} required />
            </div>

            {unit === "GRAMM" && (
              <div className="col-span-2 space-y-1.5 rounded-md border bg-muted/30 p-2.5">
                <Label htmlFor="m-spoolWeightGrams">Spulengröße (g) — für Filament</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="m-spoolWeightGrams"
                    name="spoolWeightGrams"
                    type="number"
                    step="1"
                    className="w-28"
                    value={spoolWeightGrams || ""}
                    onChange={(e) => setSpoolWeightGrams(Number(e.target.value) || 0)}
                    placeholder="z.B. 1000"
                  />
                  <span className="text-muted-foreground text-xs">g pro Spule</span>
                </div>
                {spoolWeightGrams > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <Label htmlFor="m-spoolCount" className="text-xs">Anzahl Spulen</Label>
                    <Input
                      id="m-spoolCount"
                      type="number"
                      step="0.1"
                      className="w-24"
                      value={spoolCount || ""}
                      onChange={(e) => handleSpoolCountChange(Number(e.target.value) || 0)}
                    />
                    <span className="text-muted-foreground text-xs">
                      = {stock} g Bestand
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="m-stock">Bestand ({unit === "GRAMM" ? "g" : unit === "MILLILITER" ? "ml" : unit === "STUECK" ? "Stk" : "m"})</Label>
              <Input
                id="m-stock"
                name="stock"
                type="number"
                step="0.001"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-minStock">Mindestbestand</Label>
              <Input id="m-minStock" name="minStock" type="number" step="0.001" defaultValue={values.minStock} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-photoUrl">Foto-URL (optional)</Label>
              <Input id="m-photoUrl" name="photoUrl" type="url" defaultValue={values.photoUrl} placeholder="https://…" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-supplier">Lieferant</Label>
              <Input id="m-supplier" name="supplier" defaultValue={values.supplier} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-note">Notiz</Label>
              <Textarea id="m-note" name="note" defaultValue={values.note} rows={2} />
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
