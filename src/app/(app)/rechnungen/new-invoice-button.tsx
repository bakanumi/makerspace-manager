"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInvoiceForOrder } from "./actions";

export function NewInvoiceButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const res = await createInvoiceForOrder(orderId);
      if (res.success) {
        toast.success("Rechnung erstellt");
      } else {
        toast.error(res.error ?? "Fehler beim Erstellen");
      }
    });
  };

  return (
    <Button size="sm" variant="outline" className="gap-1.5" onClick={handleClick} disabled={isPending}>
      <FileText className="h-3.5 w-3.5" />
      {isPending ? "Erstellen…" : "Rechnung erstellen"}
    </Button>
  );
}
