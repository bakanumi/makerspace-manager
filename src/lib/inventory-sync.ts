import { createHash, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Anbindung der Inventur-App (selbst gehostete Barcode-/Lager-App).
 *
 * Die Inventur-App ist die führende Datenbank für freigegebene Kategorien und
 * schreibt diese über /api/inventory-sync/... als Material in genau ein Konto
 * (INVENTORY_SYNC_ORG_ID). Wie bei Spoolman gibt es auf dieser Seite keine
 * Mandanten-Auswahl, der Token gehört fest zu diesem Konto.
 */

const hash = (v: string) => createHash("sha256").update(v).digest();

function tokenMatches(given: string) {
  const expected = process.env.INVENTORY_SYNC_TOKEN;
  if (!expected || expected.length < 16) return false;
  // Hashes vergleichen: gleiche Länge, keine Rückschlüsse über die Laufzeit
  return timingSafeEqual(hash(given), hash(expected));
}

export class SyncAuthError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** prüft den Bearer-Token und liefert das Ziel-Konto */
export async function requireInventorySync(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!process.env.INVENTORY_SYNC_TOKEN) {
    throw new SyncAuthError(503, "Inventur-Sync ist nicht eingerichtet (INVENTORY_SYNC_TOKEN fehlt)");
  }
  if (!token || !tokenMatches(token)) throw new SyncAuthError(401, "Token ungültig");

  const configured = process.env.INVENTORY_SYNC_ORG_ID;
  if (configured) {
    const org = await prisma.organization.findUnique({ where: { id: configured }, select: { id: true, name: true } });
    if (!org) throw new SyncAuthError(503, "INVENTORY_SYNC_ORG_ID zeigt auf kein bestehendes Konto");
    return org;
  }
  // Ohne Angabe nur eindeutig, wenn es genau ein Konto gibt
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true }, take: 2 });
  if (orgs.length !== 1) throw new SyncAuthError(503, "Mehrere Konten vorhanden – bitte INVENTORY_SYNC_ORG_ID setzen");
  return orgs[0];
}

export function syncErrorResponse(error: unknown) {
  if (error instanceof SyncAuthError) return Response.json({ error: error.message }, { status: error.status });
  console.error("[inventory-sync]", error);
  return Response.json({ error: "Interner Fehler" }, { status: 500 });
}

export const round3 = (n: number) => Math.round(n * 1000) / 1000;
