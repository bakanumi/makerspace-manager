"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCorrectionInvoice } from "./actions";

export function CorrectionInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!confirm("Korrekturrechnung (Stornorechnung) für diese Rechnung erstellen?")) return;
    startTransition(async () => {
      const res = await createCorrectionInvoice(invoiceId);
      if (res.success) {
        toast.success("Korrekturrechnung erstellt");
      } else {
        toast.error(res.error ?? "Fehler beim Erstellen");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={handleClick}
      title="Korrekturrechnung erstellen"
    >
      <Undo2 className="h-3.5 w-3.5" />
    </Button>
  );
}
