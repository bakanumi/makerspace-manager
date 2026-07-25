"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCustomer } from "./actions";
import { CustomerDialog, type CustomerFormValues } from "./customer-dialog";

export function CustomerTable({ customers }: { customers: CustomerFormValues[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteCustomer(id);
        toast.success("Kunde gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen (hat er evtl. noch Bestellungen?)");
      }
    });
  };

  if (customers.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Noch kein Kunde erfasst.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden sm:table-cell">Nr.</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">E-Mail</TableHead>
            <TableHead className="hidden md:table-cell">Telefon</TableHead>
            <TableHead className="hidden sm:table-cell">Ort</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {c.customerNumber ? String(c.customerNumber).padStart(4, "0") : "–"}
              </TableCell>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {c.email || "–"}
              </TableCell>
              <TableCell className="text-muted-foreground hidden md:table-cell">
                {c.phone || "–"}
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {[c.postalCode, c.city].filter(Boolean).join(" ") || "–"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <CustomerDialog customer={c} />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(c.id, c.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
