import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export const metadata: Metadata = {
  title: "Werkstatt Manager",
  description: "Inventar, Kalkulation, Kunden & Rechnungen für 3D-Druck und Lasergravur",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const org = await prisma.organization.findFirst({
    select: { themeColor: true, themeMode: true },
  });
  const themeColor = org?.themeColor ?? "blue";
  const themeMode = org?.themeMode ?? "SYSTEM";
  const forcedClass = themeMode === "DARK" ? "dark" : themeMode === "LIGHT" ? "light" : "";

  return (
    <html
      lang="de"
      data-theme={themeColor}
      className={`h-full antialiased ${forcedClass}`}
    >
      <head>
        {themeMode === "SYSTEM" && (
          <script
            // Verhindert Flackern: setzt .dark vor dem ersten Paint, falls das OS Dunkelmodus meldet.
            dangerouslySetInnerHTML={{
              __html:
                "try{if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark')}}catch(e){}",
            }}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
