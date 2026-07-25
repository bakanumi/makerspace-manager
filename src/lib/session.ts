import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Nicht angemeldet");
  }
  return session;
}

export async function requireOrgId() {
  const session = await requireSession();
  return session.user.organizationId;
}
