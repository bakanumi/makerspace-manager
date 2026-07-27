import { RegisterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Neues Konto erstellen</h1>
          <p className="text-muted-foreground text-sm">
            Lege dein eigenes Unternehmen mit eigenen Daten an — komplett
            unabhängig von anderen Konten.
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
