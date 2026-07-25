"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import { createCoupon } from "./actions";

export function CouponDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createCoupon({}, formData);
      if (res.success) {
        toast.success("Rabattcode angelegt");
        setOpen(false);
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Neuer Rabattcode
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Neuer Rabattcode</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-code">Code</Label>
              <Input id="c-code" name="code" placeholder="z.B. FREUNDE10" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-type">Typ</Label>
              <NativeSelect id="c-type" name="type" defaultValue="PERCENT">
                <option value="PERCENT">Prozent</option>
                <option value="FIXED">Fester Betrag (€)</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-value">Wert</Label>
              <Input id="c-value" name="value" type="number" step="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-validFrom">Gültig ab (optional)</Label>
              <Input id="c-validFrom" name="validFrom" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-validUntil">Gültig bis (optional)</Label>
              <Input id="c-validUntil" name="validUntil" type="date" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-maxUses">Max. Nutzungen (optional)</Label>
              <Input id="c-maxUses" name="maxUses" type="number" step="1" min="1" placeholder="unbegrenzt" />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input id="c-active" name="active" type="checkbox" defaultChecked className="h-4 w-4" />
              <Label htmlFor="c-active">Aktiv</Label>
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
