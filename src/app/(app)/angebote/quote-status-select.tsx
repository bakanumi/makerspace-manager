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
import { updateQuoteStatus } from "./actions";

export const quoteStatusLabel: Record<string, string> = {
  OFFEN: "Offen",
  ANGENOMMEN: "Angenommen",
  ABGELEHNT: "Abgelehnt",
  ABGELAUFEN: "Abgelaufen",
};

export function QuoteStatusSelect({ quoteId, status }: { quoteId: string; status: string }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string | null) => {
    if (!value) return;
    startTransition(async () => {
      try {
        await updateQuoteStatus(quoteId, value);
        toast.success("Status aktualisiert");
      } catch {
        toast.error("Status konnte nicht aktualisiert werden");
      }
    });
  };

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue>{(value: string) => quoteStatusLabel[value] ?? value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(quoteStatusLabel).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
