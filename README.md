# Werkstatt Manager

Webbasierte App für 3D-Druck & Lasergravur-Business: Inventar (Material &
Geräte), Kalkulator (Material-, Strom- und Verschleißkosten), Kunden &
Bestellungen mit automatischem Lagerabzug, Fertigprodukte sowie
Rechnungsstellung (PDF, Kleinunternehmerregelung §19 UStG).

Läuft im Browser auf PC & Smartphone (responsives Layout, Sidebar am Desktop,
Menü-Sheet am Handy).

## Tech-Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui (Base UI)
- Prisma ORM + PostgreSQL
- Auth.js (Credentials-Login)
- @react-pdf/renderer für Rechnungs-PDFs

Das Datenmodell ist mandantenfähig (`Organization` als Besitzer aller Daten),
damit später eine Multi-Tenant-Variante mit Registrierung & Abo (Phase 2)
ergänzt werden kann, ohne das Schema umzubauen.

## Lokale Entwicklung

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. Lokale Postgres-Datenbank starten (Prisma-eigener Dev-Server, kein
   Docker/Setup nötig):
   ```bash
   npx prisma dev
   ```
   Das gibt eine `DATABASE_URL` aus (`prisma+postgres://...`) – diese in
   `.env` eintragen (siehe unten). Den entsprechenden `postgres://...`
   TCP-Connection-String (aus derselben Ausgabe) als `DIRECT_DATABASE_URL`
   eintragen.
3. `.env` Datei anlegen (siehe `.env` im Repo als Vorlage) mit:
   - `DATABASE_URL` – für die Prisma-CLI (Migrationen)
   - `DIRECT_DATABASE_URL` – für den App-Client zur Laufzeit (pg-Adapter)
   - `AUTH_SECRET` – beliebiger langer Zufallsstring
   - `NEXTAUTH_URL` – `http://localhost:3000` lokal
4. Datenbankschema anwenden:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Dev-Server starten:
   ```bash
   npm run dev
   ```
6. Im Browser `http://localhost:3000` öffnen – beim allerersten Start
   erscheint die Ersteinrichtung (Firma + eigener Account anlegen).

## Deployment (Cloud)

Empfohlen: **Vercel** (Next.js) + **Neon** (Postgres, kostenloses Tier).

1. Bei [neon.tech](https://neon.tech) ein kostenloses Projekt anlegen, die
   Postgres-Connection-Strings kopieren (Pooled + Direct).
2. Bei [vercel.com](https://vercel.com) das Repo importieren.
3. In den Vercel-Projekteinstellungen unter „Environment Variables“
   eintragen:
   - `DATABASE_URL` und `DIRECT_DATABASE_URL` → Neon-Connection-Strings
   - `AUTH_SECRET` → neuer, sicherer Zufallsstring (z. B. `openssl rand -base64 32`)
   - `NEXTAUTH_URL` → die Vercel-Domain (z. B. `https://deine-app.vercel.app`)
4. Vor dem ersten Deploy einmalig lokal gegen die Neon-Datenbank
   `npx prisma migrate dev --name init` laufen lassen (erzeugt die
   Migrations-Historie), dann committen. Bei späteren Schema-Änderungen
   `npx prisma migrate deploy` im Build-Schritt verwenden.
5. Deployen. Beim ersten Aufruf der Live-URL erscheint wieder die
   Ersteinrichtung.

## Rechnungen

Rechnungen werden serverseitig als PDF live generiert (kein Datei-Storage
nötig) – Route `/rechnungen/[id]/pdf`. Fortlaufende Rechnungsnummer und
Kleinunternehmer-Hinweistext kommen aus den Einstellungen.
