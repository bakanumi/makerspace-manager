"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createOrganizationAndOwner, type SetupState } from "./actions";

const initialState: SetupState = {};

export function SetupForm() {
  const [state, formAction, pending] = useActionState(
    createOrganizationAndOwner,
    initialState
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Firmenname</Label>
            <Input id="orgName" name="orgName" required placeholder="Meine Werkstatt" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Dein Name</Label>
            <Input id="name" name="name" required placeholder="Vorname Nachname" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" name="email" type="email" required placeholder="du@beispiel.de" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          {state.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Wird eingerichtet…" : "Account erstellen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
