import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const accentByTemplate = {
  STANDARD: "#1a1a1a",
  MODERN: "#2563eb",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

export type DocumentPdfProps = {
  kind: "Rechnung" | "Angebot";
  documentNumber: string;
  issuedAt: string;
  validUntil?: string;
  taxMode: "KLEINUNTERNEHMER" | "REGELBESTEUERUNG";
  vatRatePercent: number;
  itemsSubtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalNet: number;
  totalGross: number;
  pdfTemplate: "STANDARD" | "MODERN";
  organization: {
    name: string;
    addressLine1: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
    email: string | null;
    phone: string | null;
    taxId: string | null;
    logoUrl: string | null;
    footerText: string | null;
    showPhone: boolean;
    showEmail: boolean;
  };
  customer: {
    name: string;
    addressLine1: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
    customerNumber: number | null;
  };
  items: { name: string; quantity: number; unitPrice: number }[];
};

export function InvoicePdf({
  kind,
  documentNumber,
  issuedAt,
  validUntil,
  taxMode,
  vatRatePercent,
  itemsSubtotal,
  discountAmount,
  shippingCost,
  totalNet,
  totalGross,
  pdfTemplate,
  organization,
  customer,
  items,
}: DocumentPdfProps) {
  const vatAmount = totalGross - totalNet;
  const accent = accentByTemplate[pdfTemplate];

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    logo: { width: 100, maxHeight: 60, objectFit: "contain" },
    title: { fontSize: 18, fontWeight: 700, marginBottom: 4, color: accent },
    metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
    addressBlock: { marginBottom: 6 },
    addressLabel: { fontSize: 8, color: "#888", marginBottom: 2, textTransform: "uppercase" },
    sellerBlock: { alignItems: "flex-end", marginBottom: 24 },
    sellerText: { fontSize: 9, color: "#555", textAlign: "right" },
    table: { marginTop: 10 },
    tableHeader: {
      flexDirection: "row",
      borderBottom: `1pt solid ${accent}`,
      paddingBottom: 4,
      marginBottom: 4,
      fontWeight: 700,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 3,
      borderBottom: "0.5pt solid #ddd",
    },
    colName: { flex: 3 },
    colQty: { flex: 1, textAlign: "right" },
    colPrice: { flex: 1, textAlign: "right" },
    colTotal: { flex: 1, textAlign: "right" },
    totals: { marginTop: 16, alignItems: "flex-end" },
    totalRow: { flexDirection: "row", width: 220, justifyContent: "space-between", marginTop: 2 },
    totalRowBold: {
      flexDirection: "row",
      width: 220,
      justifyContent: "space-between",
      marginTop: 6,
      paddingTop: 6,
      borderTop: `1pt solid ${accent}`,
      fontWeight: 700,
    },
    footer: { marginTop: 30, fontSize: 8, color: "#666" },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {kind} {documentNumber}
            </Text>
            <View style={styles.metaRow}>
              <Text>Datum: {issuedAt}</Text>
            </View>
            {validUntil && (
              <View style={styles.metaRow}>
                <Text>Gültig bis: {validUntil}</Text>
              </View>
            )}
          </View>
          {organization.logoUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={organization.logoUrl} style={styles.logo} />
          )}
        </View>

        <View style={styles.addressBlock}>
          <Text style={styles.addressLabel}>Rechnungsempfänger</Text>
          <Text>{customer.name}</Text>
          {customer.addressLine1 && <Text>{customer.addressLine1}</Text>}
          <Text>{[customer.postalCode, customer.city].filter(Boolean).join(" ")}</Text>
          <Text>{customer.country}</Text>
          {customer.customerNumber && (
            <Text>Kundennummer: {String(customer.customerNumber).padStart(4, "0")}</Text>
          )}
        </View>

        <View style={styles.sellerBlock}>
          <Text style={styles.sellerText}>{organization.name}</Text>
          {organization.addressLine1 && (
            <Text style={styles.sellerText}>{organization.addressLine1}</Text>
          )}
          <Text style={styles.sellerText}>
            {[organization.postalCode, organization.city].filter(Boolean).join(" ")}
          </Text>
          <Text style={styles.sellerText}>{organization.country}</Text>
          {organization.showEmail && organization.email && (
            <Text style={styles.sellerText}>{organization.email}</Text>
          )}
          {organization.showPhone && organization.phone && (
            <Text style={styles.sellerText}>{organization.phone}</Text>
          )}
          {organization.taxId && (
            <Text style={styles.sellerText}>USt-ID/Steuernr.: {organization.taxId}</Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colName}>Position</Text>
            <Text style={styles.colQty}>Menge</Text>
            <Text style={styles.colPrice}>Einzelpreis</Text>
            <Text style={styles.colTotal}>Gesamt</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{fmt(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{fmt(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Zwischensumme</Text>
            <Text>{fmt(itemsSubtotal)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Rabatt</Text>
              <Text>−{fmt(discountAmount)}</Text>
            </View>
          )}
          {shippingCost > 0 && (
            <View style={styles.totalRow}>
              <Text>Versand</Text>
              <Text>{fmt(shippingCost)}</Text>
            </View>
          )}
          {taxMode === "REGELBESTEUERUNG" && (
            <View style={styles.totalRow}>
              <Text>USt. ({vatRatePercent}%)</Text>
              <Text>{fmt(vatAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRowBold}>
            <Text>Gesamtbetrag</Text>
            <Text>{fmt(totalGross)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {taxMode === "KLEINUNTERNEHMER" ? (
            <Text>Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.</Text>
          ) : (
            <Text>Es gilt der jeweils angegebene Umsatzsteuersatz.</Text>
          )}
          {organization.footerText && <Text style={{ marginTop: 4 }}>{organization.footerText}</Text>}
        </View>
      </Page>
    </Document>
  );
}
