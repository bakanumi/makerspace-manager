"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/format";
import { deleteDevice } from "./actions";
import { DeviceDialog, type DeviceFormValues } from "./device-dialog";

const typeLabel: Record<DeviceFormValues["type"], string> = {
  DRUCKER_3D: "3D-Drucker",
  LASERGRAVUR: "Lasergravur",
};

export function DeviceTable({ devices }: { devices: DeviceFormValues[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteDevice(id);
        toast.success("Gerät gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen (wird es evtl. noch verwendet?)");
      }
    });
  };

  if (devices.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Noch kein Gerät erfasst.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead className="text-right">Anschaffung</TableHead>
            <TableHead className="text-right">Leistung</TableHead>
            <TableHead className="text-right">Nutzung</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((d) => {
            const usagePercent = Math.min(
              100,
              Math.round((d.operatingHours / d.expectedLifetimeHours) * 100)
            );
            const worn = usagePercent >= 90;
            return (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{typeLabel[d.type]}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(d.purchasePrice)}</TableCell>
                <TableCell className="text-right">{formatNumber(d.powerConsumptionKw, 3)} kW</TableCell>
                <TableCell className="text-right">
                  <span className={worn ? "text-destructive font-medium" : ""}>
                    {formatNumber(d.operatingHours, 0)} / {formatNumber(d.expectedLifetimeHours, 0)} h ({usagePercent}%)
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <DeviceDialog device={d} />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleDelete(d.id, d.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
