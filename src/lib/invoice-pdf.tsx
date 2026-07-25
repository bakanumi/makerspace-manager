import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
  seller: { fontSize: 9, color: "#555", maxWidth: 220 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  addressBlock: { marginBottom: 24 },
  addressLabel: { fontSize: 8, color: "#888", marginBottom: 2, textTransform: "uppercase" },
  table: { marginTop: 10 },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1pt solid #333",
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
  totalRow: { flexDirection: "row", width: 200, justifyContent: "space-between", marginTop: 2 },
  totalRowBold: {
    flexDirection: "row",
    width: 200,
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1pt solid #333",
    fontWeight: 700,
  },
  footer: { marginTop: 30, fontSize: 8, color: "#666" },
});

const fmt = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

export type InvoicePdfProps = {
  invoiceNumber: string;
  issuedAt: string;
  taxMode: "KLEINUNTERNEHMER" | "REGELBESTEUERUNG";
  vatRatePercent: number;
  totalNet: number;
  totalGross: number;
  organization: {
    name: string;
    addressLine1: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
    email: string | null;
    taxId: string | null;
  };
  customer: {
    name: string;
    addressLine1: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
  };
  items: { name: string; quantity: number; unitPrice: number }[];
};

export function InvoicePdf({
  invoiceNumber,
  issuedAt,
  taxMode,
  vatRatePercent,
  totalNet,
  totalGross,
  organization,
  customer,
  items,
}: InvoicePdfProps) {
  const vatAmount = totalGross - totalNet;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rechnung {invoiceNumber}</Text>
            <View style={styles.metaRow}>
              <Text>Datum: {issuedAt}</Text>
            </View>
          </View>
          <View style={styles.seller}>
            <Text>{organization.name}</Text>
            {organization.addressLine1 && <Text>{organization.addressLine1}</Text>}
            <Text>
              {[organization.postalCode, organization.city].filter(Boolean).join(" ")}
            </Text>
            <Text>{organization.country}</Text>
            {organization.email && <Text>{organization.email}</Text>}
            {organization.taxId && <Text>USt-ID/Steuernr.: {organization.taxId}</Text>}
          </View>
        </View>

        <View style={styles.addressBlock}>
          <Text style={styles.addressLabel}>Rechnungsempfänger</Text>
          <Text>{customer.name}</Text>
          {customer.addressLine1 && <Text>{customer.addressLine1}</Text>}
          <Text>{[customer.postalCode, customer.city].filter(Boolean).join(" ")}</Text>
          <Text>{customer.country}</Text>
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
            <Text>Zwischensumme (netto)</Text>
            <Text>{fmt(totalNet)}</Text>
          </View>
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
        </View>
      </Page>
    </Document>
  );
}
