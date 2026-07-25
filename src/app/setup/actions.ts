"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  orgName: z.string().min(2, "Firmenname ist zu kurz"),
  name: z.string().min(1, "Name fehlt"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
});

export type SetupState = { error?: string };

export async function createOrganizationAndOwner(
  _prevState: SetupState,
  formData: FormData
): Promise<SetupState> {
  const existing = await prisma.organization.findFirst();
  if (existing) {
    redirect("/login");
  }

  const parsed = setupSchema.safeParse({
    orgName: formData.get("orgName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { orgName, name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.organization.create({
    data: {
      name: orgName,
      users: {
        create: { email, name, passwordHash },
      },
    },
  });

  redirect("/login?setup=done");
}
