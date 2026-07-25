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
import { createDevice, updateDevice } from "./actions";

export type DeviceFormValues = {
  id: string;
  name: string;
  type: "DRUCKER_3D" | "LASERGRAVUR";
  purchasePrice: number;
  powerConsumptionKw: number;
  expectedLifetimeHours: number;
  operatingHours: number;
  wearFactor: number;
  maintenanceNote: string;
};

const defaultWearFactor: Record<DeviceFormValues["type"], number> = {
  DRUCKER_3D: 0.05,
  LASERGRAVUR: 0.12,
};

const emptyDevice: Omit<DeviceFormValues, "id"> = {
  name: "",
  type: "DRUCKER_3D",
  purchasePrice: 0,
  powerConsumptionKw: 0,
  expectedLifetimeHours: 1000,
  operatingHours: 0,
  wearFactor: defaultWearFactor.DRUCKER_3D,
  maintenanceNote: "",
};

export function DeviceDialog({ device }: { device?: DeviceFormValues }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const values = device ?? emptyDevice;
  const [type, setType] = useState(values.type);
  const [wearFactor, setWearFactor] = useState(values.wearFactor);

  const handleTypeChange = (newType: DeviceFormValues["type"]) => {
    setType(newType);
    if (!device) setWearFactor(defaultWearFactor[newType]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const action = device ? updateDevice : createDevice;
    startTransition(async () => {
      const res = await action({}, formData);
      if (res.success) {
        toast.success(device ? "Gerät aktualisiert" : "Gerät angelegt");
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
          device ? (
            <Button variant="ghost" size="icon-sm" />
          ) : (
            <Button className="gap-1.5" />
          )
        }
      >
        {device ? <Pencil className="h-3.5 w-3.5" /> : (
          <>
            <Plus className="h-4 w-4" />
            Neues Gerät
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{device ? "Gerät bearbeiten" : "Neues Gerät"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {device && <input type="hidden" name="id" value={device.id} />}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="d-name">Name</Label>
              <Input id="d-name" name="name" defaultValue={values.name} required />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="d-type">Typ</Label>
              <NativeSelect
                id="d-type"
                name="type"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as DeviceFormValues["type"])}
              >
                <option value="DRUCKER_3D">3D-Drucker</option>
                <option value="LASERGRAVUR">Lasergravur</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-wearFactor">Verschleißfaktor (€/h)</Label>
              <Input
                id="d-wearFactor"
                name="wearFactor"
                type="number"
                step="0.01"
                value={wearFactor}
                onChange={(e) => setWearFactor(Number(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-purchasePrice">Anschaffungspreis (€)</Label>
              <Input id="d-purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={values.purchasePrice} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-powerConsumptionKw">Leistung (kW)</Label>
              <Input id="d-powerConsumptionKw" name="powerConsumptionKw" type="number" step="0.001" defaultValue={values.powerConsumptionKw} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-expectedLifetimeHours">Erw. Lebensdauer (h)</Label>
              <Input id="d-expectedLifetimeHours" name="expectedLifetimeHours" type="number" step="1" defaultValue={values.expectedLifetimeHours} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-operatingHours">Betriebsstunden bisher</Label>
              <Input id="d-operatingHours" name="operatingHours" type="number" step="0.1" defaultValue={values.operatingHours} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="d-maintenanceNote">Wartungsnotiz</Label>
              <Textarea id="d-maintenanceNote" name="maintenanceNote" defaultValue={values.maintenanceNote} rows={2} />
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
