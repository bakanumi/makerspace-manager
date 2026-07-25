"use server";

import { put } from "@vercel/blob";
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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      error:
        "Foto-Upload ist lokal nicht eingerichtet (BLOB_READ_WRITE_TOKEN fehlt). Bitte Foto-URL manuell eintragen.",
    };
  }

  const blob = await put(`${organizationId}/${Date.now()}-${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return { url: blob.url };
}
