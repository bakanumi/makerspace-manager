import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existing = await prisma.organization.findFirst();
  if (existing) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Ersteinrichtung</h1>
          <p className="text-muted-foreground text-sm">
            Lege deine Firma und deinen Account an. Dieser Schritt ist nur
            beim allerersten Start nötig.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
