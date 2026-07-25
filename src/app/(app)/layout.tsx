import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const organization = await prisma.organization.findUnique({
    where: { id: session!.user.organizationId },
    select: { name: true },
  });

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AppShell
      orgName={organization?.name ?? "Werkstatt Manager"}
      userName={session!.user.email ?? ""}
      onSignOut={handleSignOut}
    >
      {children}
    </AppShell>
  );
}
