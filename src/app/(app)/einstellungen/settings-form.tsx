"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSettings, type SettingsState } from "./actions";

type OrgFormValues = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  taxId: string;
  taxMode: "KLEINUNTERNEHMER" | "REGELBESTEUERUNG";
  vatRatePercent: number;
  electricityPricePerKwh: number;
  defaultHourlyRate: number;
  defaultMarginPercent: number;
  invoiceNumberPrefix: string;
  invoiceCounter: number;
};

const initialState: SettingsState = {};

export function SettingsForm({ org }: { org: OrgFormValues }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);

  useEffect(() => {
    if (state.success) toast.success("Einstellungen gespeichert");
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Firmendaten</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Firmenname</Label>
            <Input id="name" name="name" defaultValue={org.name} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressLine1">Adresse</Label>
            <Input id="addressLine1" name="addressLine1" defaultValue={org.addressLine1} placeholder="Straße & Hausnummer" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Input name="addressLine2" defaultValue={org.addressLine2} placeholder="Adresszusatz (optional)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">PLZ</Label>
            <Input id="postalCode" name="postalCode" defaultValue={org.postalCode} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ort</Label>
            <Input id="city" name="city" defaultValue={org.city} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Land</Label>
            <Input id="country" name="country" defaultValue={org.country} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxId">Steuernummer / USt-ID</Label>
            <Input id="taxId" name="taxId" defaultValue={org.taxId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" name="email" type="email" defaultValue={org.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={org.phone} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Steuer & Rechnungen</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taxMode">Besteuerung</Label>
            <Select name="taxMode" defaultValue={org.taxMode}>
              <SelectTrigger id="taxMode" className="w-full">
                <SelectValue>
                  {(value: string) =>
                    value === "KLEINUNTERNEHMER"
                      ? "Kleinunternehmer (§19 UStG)"
                      : "Regelbesteuerung"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KLEINUNTERNEHMER">
                  Kleinunternehmer (§19 UStG)
                </SelectItem>
                <SelectItem value="REGELBESTEUERUNG">Regelbesteuerung</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatRatePercent">USt.-Satz (%)</Label>
            <Input
              id="vatRatePercent"
              name="vatRatePercent"
              type="number"
              step="0.01"
              defaultValue={org.vatRatePercent}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="invoiceNumberPrefix">Rechnungsnummern-Präfix</Label>
            <Input
              id="invoiceNumberPrefix"
              name="invoiceNumberPrefix"
              defaultValue={org.invoiceNumberPrefix}
              required
            />
            <p className="text-muted-foreground text-xs">
              Nächste Rechnungsnummer: {org.invoiceNumberPrefix}-
              {String(org.invoiceCounter + 1).padStart(4, "0")}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kalkulator-Standardwerte</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="electricityPricePerKwh">Strompreis (€/kWh)</Label>
            <Input
              id="electricityPricePerKwh"
              name="electricityPricePerKwh"
              type="number"
              step="0.0001"
              defaultValue={org.electricityPricePerKwh}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultHourlyRate">Stundensatz Arbeitszeit (€)</Label>
            <Input
              id="defaultHourlyRate"
              name="defaultHourlyRate"
              type="number"
              step="0.01"
              defaultValue={org.defaultHourlyRate}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultMarginPercent">Standard-Gewinnmarge (%)</Label>
            <Input
              id="defaultMarginPercent"
              name="defaultMarginPercent"
              type="number"
              step="0.1"
              defaultValue={org.defaultMarginPercent}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? "Speichern…" : "Speichern"}
      </Button>
    </form>
  );
}
