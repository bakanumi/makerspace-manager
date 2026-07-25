"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCustomer, updateCustomer } from "./actions";

export type CustomerFormValues = {
  id: string;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  note: string;
};

const emptyCustomer: Omit<CustomerFormValues, "id"> = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  country: "Deutschland",
  note: "",
};

export function CustomerDialog({ customer }: { customer?: CustomerFormValues }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = customer ?? emptyCustomer;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const action = customer ? updateCustomer : createCustomer;
    startTransition(async () => {
      const res = await action({}, formData);
      if (res.success) {
        toast.success(customer ? "Kunde aktualisiert" : "Kunde angelegt");
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
          customer ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button className="gap-1.5" />
          )
        }
      >
        {customer ? <Pencil className="h-3.5 w-3.5" /> : (
          <>
            <Plus className="h-4 w-4" />
            Neuer Kunde
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "Kunde bearbeiten" : "Neuer Kunde"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {customer && <input type="hidden" name="id" value={customer.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" name="name" defaultValue={values.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">E-Mail</Label>
              <Input id="c-email" name="email" type="email" defaultValue={values.email} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Telefon</Label>
              <Input id="c-phone" name="phone" defaultValue={values.phone} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-addressLine1">Adresse</Label>
              <Input id="c-addressLine1" name="addressLine1" defaultValue={values.addressLine1} placeholder="Straße & Hausnummer" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Input name="addressLine2" defaultValue={values.addressLine2} placeholder="Adresszusatz (optional)" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-postalCode">PLZ</Label>
              <Input id="c-postalCode" name="postalCode" defaultValue={values.postalCode} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-city">Ort</Label>
              <Input id="c-city" name="city" defaultValue={values.city} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-country">Land</Label>
              <Input id="c-country" name="country" defaultValue={values.country} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="c-note">Notiz</Label>
              <Textarea id="c-note" name="note" defaultValue={values.note} rows={2} />
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
