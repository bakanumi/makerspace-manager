"use server";

import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireOrgId } from "@/lib/session";

export type UploadState = { url?: string; error?: string };

export async function uploadImage(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const organizationId = await requireOrgId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Keine Datei ausgewählt" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Nur Bilddateien sind erlaubt" };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "Datei ist zu groß (max. 8 MB)" };
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${organizationId}/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  }

  // Kein Vercel Blob konfiguriert: lokal in public/uploads speichern. Setzt ein
  // persistentes Dateisystem voraus (eigener Server mit "next start"), funktioniert
  // NICHT auf Vercel (dort ist BLOB_READ_WRITE_TOKEN immer gesetzt).
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filename = `${organizationId}-${Date.now()}-${safeName}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return { url: `/uploads/${filename}` };
}
