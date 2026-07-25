"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
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
import { createShippingOption, updateShippingOption } from "./actions";

export type ShippingFormValues = {
  id: string;
  name: string;
  carrier: "DHL" | "HERMES" | "DPD" | "POST" | "SONSTIGE";
  cost: number;
};

const emptyShipping: Omit<ShippingFormValues, "id"> = {
  name: "",
  carrier: "DHL",
  cost: 0,
};

export function ShippingDialog({ option }: { option?: ShippingFormValues }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = option ?? emptyShipping;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const action = option ? updateShippingOption : createShippingOption;
    startTransition(async () => {
      const res = await action({}, formData);
      if (res.success) {
        toast.success(option ? "Versandart aktualisiert" : "Versandart angelegt");
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
          option ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button className="gap-1.5" />
          )
        }
      >
        {option ? <Pencil className="h-3.5 w-3.5" /> : (
          <>
            <Plus className="h-4 w-4" />
            Neue Versandart
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{option ? "Versandart bearbeiten" : "Neue Versandart"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {option && <input type="hidden" name="id" value={option.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="s-name">Bezeichnung</Label>
              <Input id="s-name" name="name" defaultValue={values.name} placeholder="z.B. Paket klein" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-carrier">Versanddienstleister</Label>
              <NativeSelect id="s-carrier" name="carrier" defaultValue={values.carrier}>
                <option value="DHL">DHL</option>
                <option value="HERMES">Hermes</option>
                <option value="DPD">DPD</option>
                <option value="POST">Deutsche Post</option>
                <option value="SONSTIGE">Sonstige</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-cost">Kosten (€)</Label>
              <Input id="s-cost" name="cost" type="number" step="0.01" defaultValue={values.cost} required />
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
