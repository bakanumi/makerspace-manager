import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; setup?: string }>;
}) {
  const existing = await prisma.organization.findFirst();
  if (!existing) {
    redirect("/setup");
  }

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Anmelden</h1>
          <p className="text-muted-foreground text-sm">
            {params.setup === "done"
              ? "Account erstellt – bitte jetzt anmelden."
              : "Melde dich mit deinen Zugangsdaten an."}
          </p>
        </div>
        <LoginForm callbackUrl={params.callbackUrl ?? "/"} />
      </div>
    </div>
  );
}
