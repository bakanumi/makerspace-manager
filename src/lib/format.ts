export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export function formatUnitPrice(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return (
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(num) + " €"
  );
}

export function formatNumber(value: number | string, fractionDigits = 2): string {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(num);
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
}
