"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteQuote } from "./actions";
import { QuoteStatusSelect } from "./quote-status-select";

export type QuoteRow = {
  id: string;
  number: string;
  customerName: string;
  issuedAt: string;
  status: string;
  total: number;
};

export function QuoteTable({ quotes }: { quotes: QuoteRow[] }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, number: string) => {
    if (!confirm(`Angebot "${number}" wirklich löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteQuote(id);
        toast.success("Angebot gelöscht");
      } catch {
        toast.error("Löschen fehlgeschlagen");
      }
    });
  };

  if (quotes.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Noch kein Angebot erstellt.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nummer</TableHead>
            <TableHead>Kunde</TableHead>
            <TableHead className="hidden sm:table-cell">Datum</TableHead>
            <TableHead className="text-right">Betrag</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.map((q) => (
            <TableRow key={q.id}>
              <TableCell className="font-medium">{q.number}</TableCell>
              <TableCell>{q.customerName}</TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {formatDate(q.issuedAt)}
              </TableCell>
              <TableCell className="text-right">{formatCurrency(q.total)}</TableCell>
              <TableCell>
                <QuoteStatusSelect quoteId={q.id} status={q.status} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Link
                    href={`/angebote/${q.id}/pdf`}
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground flex items-center px-2"
                  >
                    <Download className="h-4 w-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={() => handleDelete(q.id, q.number)}
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
