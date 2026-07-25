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
  unit: "GRAMM" | "MILLILITER" | "STUECK" | "METER";
  stock: number;
  minStock: number;
  pricePerUnit: number;
  supplier: string;
  note: string;
};

const emptyMaterial: Omit<MaterialFormValues, "id"> = {
  name: "",
  type: "",
  unit: "GRAMM",
  stock: 0,
  minStock: 0,
  pricePerUnit: 0,
  supplier: "",
  note: "",
};

export function MaterialDialog({ material }: { material?: MaterialFormValues }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = material ?? emptyMaterial;

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
              <Label htmlFor="m-unit">Einheit</Label>
              <NativeSelect id="m-unit" name="unit" defaultValue={values.unit}>
                <option value="GRAMM">Gramm</option>
                <option value="MILLILITER">Milliliter</option>
                <option value="STUECK">Stück</option>
                <option value="METER">Meter</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-stock">Bestand</Label>
              <Input id="m-stock" name="stock" type="number" step="0.001" defaultValue={values.stock} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-minStock">Mindestbestand</Label>
              <Input id="m-minStock" name="minStock" type="number" step="0.001" defaultValue={values.minStock} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="m-pricePerUnit">Preis pro Einheit (€)</Label>
              <Input id="m-pricePerUnit" name="pricePerUnit" type="number" step="0.0001" defaultValue={values.pricePerUnit} required />
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
