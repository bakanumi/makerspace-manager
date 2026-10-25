import { prisma } from "@/lib/prisma";

type SpoolmanSpool = {
  id: number;
  archived?: boolean;
  remaining_weight: number | null;
  filament: {
    id: number;
    name?: string | null;
    material?: string | null;
    color_hex?: string | null;
    weight?: number | null;
    price?: number | null;
    vendor?: { name?: string | null } | null;
  };
};

/** Ein Spoolman-Filament (Sorte) mit allen aktiven Spulen zusammengefasst. */
export type SpoolmanFilament = {
  id: number;
  name: string;
  /** Hersteller laut Spoolman (Vendor) */
  vendor: string | null;
  type: string;
  colorHex: string | null;
  /** Nettogewicht einer Spule in g */
  spoolWeight: number | null;
  /** Preis pro Gramm */
  pricePerGram: number;
  /** Summe der Restgewichte aller aktiven Spulen in g, null wenn Spoolman keine Gewichte führt */
  remaining: number | null;
  spoolCount: number;
};

const REQUEST_TIMEOUT_MS = 2500;
const SYNC_MIN_INTERVAL_MS = 15_000;

const lastSync = new Map<string, number>();

function baseUrl() {
  return process.env.SPOOLMAN_URL?.replace(/\/$/, "") || null;
}

/**
 * Die Anbindung gehört genau einem Konto (SPOOLMAN_ORG_ID): Spoolman hat keine
 * Mandanten, andere Konten würden sonst fremde Spulen sehen und angelegt bekommen.
 */
export function spoolmanEnabled(organizationId: string) {
  return baseUrl() !== null && process.env.SPOOLMAN_ORG_ID === organizationId;
}

export function filamentLabel(f: SpoolmanFilament) {
  const weight = f.remaining !== null ? ` – ${Math.round(f.remaining)} g` : "";
  const spools = f.spoolCount === 1 ? "1 Spule" : `${f.spoolCount} Spulen`;
  return `#${f.id} ${f.name} (${spools})${weight}`;
}

/** Aktive Filamente aus Spoolman, null wenn Spoolman nicht erreichbar ist. */
export async function fetchFilaments(): Promise<SpoolmanFilament[] | null> {
  const url = baseUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}/api/v1/spool?allow_archived=false`, {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const spools = (await res.json()) as SpoolmanSpool[];

    const groups = new Map<number, SpoolmanFilament>();
    for (const spool of spools) {
      if (spool.archived) continue;
      const f = spool.filament;
      let group = groups.get(f.id);
      if (!group) {
        const name = [f.vendor?.name, f.name].filter(Boolean).join(" ") || `Filament ${f.id}`;
        const weight = f.weight && f.weight > 0 ? f.weight : null;
        group = {
          id: f.id,
          name,
          vendor: f.vendor?.name?.trim() || null,
          type: f.material || "Filament",
          colorHex: f.color_hex ? `#${f.color_hex.replace(/^#/, "")}` : null,
          spoolWeight: weight,
          pricePerGram: weight && f.price ? Math.round((f.price / weight) * 10000) / 10000 : 0,
          remaining: null,
          spoolCount: 0,
        };
        groups.set(f.id, group);
      }
      group.spoolCount += 1;
      if (spool.remaining_weight !== null && spool.remaining_weight !== undefined) {
        group.remaining = (group.remaining ?? 0) + spool.remaining_weight;
      }
    }
    return [...groups.values()];
  } catch (error) {
    console.warn("[spoolman] Abruf fehlgeschlagen:", error);
    return null;
  }
}

const round3 = (n: number) => Math.max(0, Math.round(n * 1000) / 1000);

/**
 * Gleicht die Materialien mit Spoolman ab (Spoolman ist die Wahrheit):
 * - verknüpfte Materialien bekommen den Bestand aus den Restgewichten der Spulen
 * - Filamente ohne Material werden angelegt, oder ein gleichnamiges, noch nicht
 *   verknüpftes Gramm-Material wird verknüpft statt doppelt angelegt
 * - der Spoolman-Hersteller wird als Hersteller (supplier) übernommen, aber nur
 *   wenn dort noch nichts steht, damit eigene Eingaben nicht überschrieben werden
 * Wirft nie: ist Spoolman nicht erreichbar, bleibt alles unverändert.
 */
export async function syncSpoolmanStock(organizationId: string) {
  if (!spoolmanEnabled(organizationId)) return;

  const now = Date.now();
  if (now - (lastSync.get(organizationId) ?? 0) < SYNC_MIN_INTERVAL_MS) return;
  lastSync.set(organizationId, now);

  try {
    const filaments = await fetchFilaments();
    if (filaments === null) return;
    const byId = new Map(filaments.map((f) => [f.id, f]));

    const materials = await prisma.material.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        unit: true,
        stock: true,
        supplier: true,
        spoolmanFilamentId: true,
      },
    });

    // 1. Bestand verknüpfter Materialien überschreiben, fehlenden Hersteller ergänzen
    const linkedIds = new Set<number>();
    for (const material of materials) {
      if (material.spoolmanFilamentId === null || material.unit !== "GRAMM") continue;
      linkedIds.add(material.spoolmanFilamentId);
      const filament = byId.get(material.spoolmanFilamentId);
      // keine aktive Spule mehr = aufgebraucht
      const remaining = filament ? filament.remaining : 0;
      const data: { stock?: number; supplier?: string } = {};
      if (remaining !== null && Number(material.stock) !== round3(remaining)) {
        data.stock = round3(remaining);
      }
      if (filament?.vendor && !material.supplier?.trim()) {
        data.supplier = filament.vendor;
      }
      if (Object.keys(data).length === 0) continue;
      await prisma.material.update({ where: { id: material.id }, data });
    }

    // 2. Neue Filamente anlegen bzw. mit gleichnamigem Material verknüpfen
    const unlinked = materials.filter((m) => m.spoolmanFilamentId === null && m.unit === "GRAMM");
    for (const filament of filaments) {
      if (linkedIds.has(filament.id)) continue;
      const stock = round3(filament.remaining ?? 0);
      const sameName = unlinked.find(
        (m) => m.name.trim().toLowerCase() === filament.name.trim().toLowerCase()
      );
      try {
        if (sameName) {
          unlinked.splice(unlinked.indexOf(sameName), 1);
          await prisma.material.update({
            where: { id: sameName.id },
            data: {
              spoolmanFilamentId: filament.id,
              stock,
              ...(filament.vendor && !sameName.supplier?.trim() ? { supplier: filament.vendor } : {}),
            },
          });
        } else {
          await prisma.material.create({
            data: {
              organizationId,
              name: filament.name,
              type: filament.type,
              color: filament.colorHex,
              unit: "GRAMM",
              stock,
              pricePerUnit: filament.pricePerGram,
              spoolWeightGrams: filament.spoolWeight,
              supplier: filament.vendor,
              spoolmanFilamentId: filament.id,
            },
          });
        }
      } catch (error) {
        console.warn(`[spoolman] Filament ${filament.id} nicht übernommen:`, error);
      }
    }
  } catch (error) {
    console.warn("[spoolman] Sync fehlgeschlagen:", error);
  }
}
