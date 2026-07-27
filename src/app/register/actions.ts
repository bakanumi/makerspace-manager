"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const registerSchema = z.object({
  orgName: z.string().min(2, "Firmenname ist zu kurz"),
  name: z.string().min(1, "Name fehlt"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  inviteCode: z.string().min(1, "Einladungscode fehlt"),
});

export type RegisterState = { error?: string };

export async function registerOrganizationAndOwner(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    orgName: formData.get("orgName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const { orgName, name, email, password, inviteCode } = parsed.data;

  const expectedInviteCode = process.env.REGISTER_INVITE_CODE;
  if (!expectedInviteCode) {
    return { error: "Registrierung ist aktuell nicht verfügbar." };
  }
  if (inviteCode.trim() !== expectedInviteCode) {
    return { error: "Ungültiger Einladungscode." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Diese E-Mail-Adresse wird bereits verwendet." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.organization.create({
    data: {
      name: orgName,
      users: { create: { email, name, passwordHash } },
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Account wurde erstellt, die automatische Anmeldung ist aber fehlgeschlagen. Bitte manuell einloggen.",
      };
    }
    throw error;
  }
  return {};
}
