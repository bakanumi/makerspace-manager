"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "./actions";

export const statusLabel: Record<string, string> = {
  OFFEN: "Offen",
  IN_ARBEIT: "In Arbeit",
  FERTIG: "Fertig",
  VERSENDET: "Versendet",
  BEZAHLT: "Bezahlt",
  STORNIERT: "Storniert",
};

type Status = keyof typeof statusLabel;

export function StatusSelect({ orderId, status }: { orderId: string; status: Status }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string | null) => {
    if (!value) return;
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, value);
        toast.success("Status aktualisiert");
      } catch {
        toast.error("Status konnte nicht aktualisiert werden");
      }
    });
  };

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-32">
        <SelectValue>{(value: string) => statusLabel[value] ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusLabel).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
