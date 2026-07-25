import { prisma } from "@/lib/prisma";
import { requireOrgId } from "@/lib/session";
import { SettingsForm } from "./settings-form";

export default async function EinstellungenPage() {
  const organizationId = await requireOrgId();
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Einstellungen</h1>
        <p className="text-muted-foreground text-sm">
          Firmendaten, Steuer-Einstellungen und Standardwerte für den Kalkulator
        </p>
      </div>
      <SettingsForm
        org={{
          name: org.name,
          addressLine1: org.addressLine1 ?? "",
          addressLine2: org.addressLine2 ?? "",
          postalCode: org.postalCode ?? "",
          city: org.city ?? "",
          country: org.country,
          email: org.email ?? "",
          phone: org.phone ?? "",
          taxId: org.taxId ?? "",
          taxMode: org.taxMode,
          vatRatePercent: Number(org.vatRatePercent),
          electricityPricePerKwh: Number(org.electricityPricePerKwh),
          defaultHourlyRate: Number(org.defaultHourlyRate),
          defaultMarginPercent: Number(org.defaultMarginPercent),
          invoiceNumberPrefix: org.invoiceNumberPrefix,
          invoiceCounter: org.invoiceCounter,
        }}
      />
    </div>
  );
}
