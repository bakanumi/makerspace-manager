import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireInventorySync, round3, syncErrorResponse } from "@/lib/inventory-sync";
import { spoolmanEnabled } from "@/lib/spoolman";

type Ctx = { params: Promise<{ externalId: string }> };

const nullableText = (max: number) =>
  z
    .string()
    .nullish()
    .transform((v) => (v ? v.slice(0, max) : null));

const payloadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(200),
  color: nullableText(100),
  photoUrl: z.url().nullish().catch(null),
  unit: z.enum(["GRAMM", "MILLILITER", "STUECK", "METER"]),
  /** null = Bestand nicht übertragen */
  stock: z.number().finite().nullish(),
  minStock: z.number().finite().min(0).nullish(),
  pricePerUnit: z.number().finite().min(0).nullish(),
  supplier: nullableText(200),
  note: nullableText(2000),
  /**
   * Bestand, den die Inventur nach dem letzten Sync hier vermutet. Weicht der
   * echte Bestand ab, wurde hier verbraucht: dann nicht überschreiben, sondern
   * stockConflict melden – die Inventur übernimmt den Verbrauch und sendet erneut.
   */
  baseStock: z.number().finite().nullish(),
});

/** Material zu einem Inventur-Artikel anlegen oder aktualisieren (idempotent) */
export async function PUT(request: Request, { params }: Ctx) {
  try {
    const org = await requireInventorySync(request);
    const { externalId } = await params;
    const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" }, { status: 400 });
    }
    const p = parsed.data;

    const existing = await prisma.material.findUnique({
      where: { organizationId_inventoryItemId: { organizationId: org.id, inventoryItemId: externalId } },
    });

    // Bei Spoolman-verknüpften Materialien bleibt Spoolman für den Bestand zuständig
    const stockManagedBySpoolman = Boolean(existing?.spoolmanFilamentId) && spoolmanEnabled(org.id);
    let stockConflict = false;
    let stock: number | undefined;
    if (p.stock !== null && p.stock !== undefined && !stockManagedBySpoolman) {
      const current = existing ? round3(Number(existing.stock)) : null;
      if (existing && p.baseStock !== null && p.baseStock !== undefined && current !== round3(p.baseStock)) {
        stockConflict = true;
      } else {
        stock = Math.max(0, round3(p.stock));
      }
    }

    const data = {
      name: p.name,
      type: p.type,
      color: p.color,
      photoUrl: p.photoUrl ?? null,
      unit: p.unit,
      supplier: p.supplier,
      note: p.note,
      ...(p.minStock !== null && p.minStock !== undefined ? { minStock: round3(p.minStock) } : {}),
      ...(p.pricePerUnit !== null && p.pricePerUnit !== undefined ? { pricePerUnit: p.pricePerUnit } : {}),
      ...(stock !== undefined ? { stock } : {}),
    };

    const material = existing
      ? await prisma.material.update({ where: { id: existing.id }, data })
      : await prisma.material.create({ data: { ...data, organizationId: org.id, inventoryItemId: externalId } });

    return Response.json({
      id: material.id,
      externalId,
      stock: Number(material.stock),
      unit: material.unit,
      created: !existing,
      stockConflict,
      stockManagedBySpoolman,
    });
  } catch (error) {
    return syncErrorResponse(error);
  }
}

/**
 * Artikel wurde in der Inventur gelöscht oder nicht mehr freigegeben. Wird das
 * Material noch in Kalkulationen/Bestellungen verwendet, bleibt es erhalten
 * (Bestand 0, Verknüpfung gelöst), sonst wird es gelöscht.
 */
export async function DELETE(request: Request, { params }: Ctx) {
  try {
    const org = await requireInventorySync(request);
    const { externalId } = await params;
    const material = await prisma.material.findUnique({
      where: { organizationId_inventoryItemId: { organizationId: org.id, inventoryItemId: externalId } },
      include: { _count: { select: { orderItems: true, calculationLines: true } } },
    });
    if (!material) return Response.json({ deleted: false, unlinked: false });

    if (material._count.orderItems + material._count.calculationLines === 0) {
      await prisma.material.delete({ where: { id: material.id } });
      return Response.json({ deleted: true, unlinked: true });
    }
    await prisma.material.update({
      where: { id: material.id },
      data: {
        inventoryItemId: null,
        stock: 0,
        note: [material.note, "Nicht mehr aus der Inventur synchronisiert."].filter(Boolean).join("\n"),
      },
    });
    return Response.json({ deleted: false, unlinked: true });
  } catch (error) {
    return syncErrorResponse(error);
  }
}
