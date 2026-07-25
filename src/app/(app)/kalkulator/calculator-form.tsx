"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { computeCalculation } from "@/lib/calculation";
import { formatCurrency } from "@/lib/format";
import { saveCalculation } from "./actions";

type DeviceOption = {
  id: string;
  name: string;
  purchasePrice: number;
  powerConsumptionKw: number;
  expectedLifetimeHours: number;
};

type MaterialOption = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
};

const unitLabel: Record<string, string> = {
  GRAMM: "g",
  MILLILITER: "ml",
  STUECK: "Stk",
  METER: "m",
};

export function CalculatorForm({
  devices,
  materials,
  defaults,
}: {
  devices: DeviceOption[];
  materials: MaterialOption[];
  defaults: { electricityPrice: number; hourlyRate: number; marginPercent: number };
}) {
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? "");
  const [timeHours, setTimeHours] = useState(1);
  const [laborHours, setLaborHours] = useState(0);
  const [hourlyRate, setHourlyRate] = useState(defaults.hourlyRate);
  const [electricityPrice, setElectricityPrice] = useState(defaults.electricityPrice);
  const [marginPercent, setMarginPercent] = useState(defaults.marginPercent);
  const [lines, setLines] = useState<{ materialId: string; amount: number }[]>([]);
  const [isPending, startTransition] = useTransition();

  const device = devices.find((d) => d.id === deviceId);

  const result = useMemo(() => {
    if (!device) return null;
    return computeCalculation({
      devicePurchasePrice: device.purchasePrice,
      devicePowerConsumptionKw: device.powerConsumptionKw,
      deviceExpectedLifetimeHours: device.expectedLifetimeHours,
      timeHours,
      laborHours,
      hourlyRate,
      electricityPrice,
      marginPercent,
      materialLines: lines.map((l) => ({
        amount: l.amount,
        pricePerUnit: materials.find((m) => m.id === l.materialId)?.pricePerUnit ?? 0,
      })),
    });
  }, [device, timeHours, laborHours, hourlyRate, electricityPrice, marginPercent, lines, materials]);

  const addLine = () => {
    const firstUnused = materials.find((m) => !lines.some((l) => l.materialId === m.id));
    setLines([...lines, { materialId: firstUnused?.id ?? materials[0]?.id ?? "", amount: 0 }]);
  };

  const updateLine = (index: number, patch: Partial<{ materialId: string; amount: number }>) => {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!deviceId) {
      toast.error("Bitte ein Gerät auswählen");
      return;
    }
    startTransition(async () => {
      const res = await saveCalculation({
        name: name || undefined,
        deviceId,
        timeHours,
        laborHours,
        hourlyRate,
        electricityPrice,
        marginPercent,
        materialLines: lines.filter((l) => l.materialId && l.amount > 0),
      });
      if (res.success) {
        toast.success("Kalkulation gespeichert");
        setName("");
      } else {
        toast.error(res.error ?? "Fehler beim Speichern");
      }
    });
  };

  if (devices.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Lege zuerst ein Gerät unter Inventar → Geräte an, um den Kalkulator zu nutzen.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Kalkulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="k-name">Bezeichnung (optional)</Label>
            <Input
              id="k-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Schlüsselanhänger Drache"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="k-device">Gerät</Label>
              <Select value={deviceId} onValueChange={(v) => v && setDeviceId(v)}>
                <SelectTrigger id="k-device" className="w-full">
                  <SelectValue>
                    {(value: string) => devices.find((d) => d.id === value)?.name ?? "Gerät wählen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-time">Druck-/Gravurzeit (h)</Label>
              <Input
                id="k-time"
                type="number"
                step="0.1"
                value={timeHours}
                onChange={(e) => setTimeHours(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-labor">Arbeitszeit (h)</Label>
              <Input
                id="k-labor"
                type="number"
                step="0.1"
                value={laborHours}
                onChange={(e) => setLaborHours(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-rate">Stundensatz (€)</Label>
              <Input
                id="k-rate"
                type="number"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-electricity">Strompreis (€/kWh)</Label>
              <Input
                id="k-electricity"
                type="number"
                step="0.0001"
                value={electricityPrice}
                onChange={(e) => setElectricityPrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="k-margin">Gewinnmarge (%)</Label>
              <Input
                id="k-margin"
                type="number"
                step="1"
                value={marginPercent}
                onChange={(e) => setMarginPercent(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Material</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={addLine}
                disabled={materials.length === 0}
              >
                <Plus className="h-3.5 w-3.5" />
                Material hinzufügen
              </Button>
            </div>
            {materials.length === 0 && (
              <p className="text-muted-foreground text-xs">
                Kein Material erfasst – Kalkulation läuft auch ohne Material.
              </p>
            )}
            {lines.map((line, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={line.materialId}
                  onValueChange={(v) => v && updateLine(i, { materialId: v })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue>
                      {(value: string) => materials.find((m) => m.id === value)?.name ?? "Material wählen"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.001"
                  className="w-28"
                  value={line.amount}
                  onChange={(e) => updateLine(i, { amount: Number(e.target.value) || 0 })}
                />
                <span className="text-muted-foreground w-8 text-xs">
                  {unitLabel[materials.find((m) => m.id === line.materialId)?.unit ?? ""] ?? ""}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => removeLine(i)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Speichern…" : "Kalkulation speichern"}
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-4">
        <CardHeader>
          <CardTitle>Ergebnis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Materialkosten" value={result?.materialCost ?? 0} />
          <Row label="Stromkosten" value={result?.electricityCost ?? 0} />
          <Row label="Verschleiß/Abschreibung" value={result?.wearCost ?? 0} />
          <Row label="Arbeitszeit" value={result?.laborCost ?? 0} />
          <div className="border-t pt-2">
            <Row label="Selbstkosten" value={result?.costPrice ?? 0} bold />
          </div>
          <div className="border-t pt-2">
            <Row label="Verkaufspreis" value={result?.sellingPrice ?? 0} bold accent />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: number;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className={accent ? "text-primary" : "text-muted-foreground"}>{label}</span>
      <span className={accent ? "text-primary" : ""}>{formatCurrency(value)}</span>
    </div>
  );
}
