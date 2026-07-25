"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reissueInvoiceForOrder } from "./actions";

export function ReissueInvoiceButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (
      !confirm(
        "Rechnung aktualisieren? Die aktuelle Rechnung wird per Korrekturrechnung storniert und eine neue mit den aktuellen Bestelldaten ausgestellt."
      )
    )
      return;
    startTransition(async () => {
      const res = await reissueInvoiceForOrder(orderId);
      if (res.success) {
        toast.success("Rechnung aktualisiert");
      } else {
        toast.error(res.error ?? "Fehler beim Aktualisieren");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={handleClick}
      title="Rechnung aktualisieren"
    >
      <RefreshCw className="h-3.5 w-3.5" />
    </Button>
  );
}
