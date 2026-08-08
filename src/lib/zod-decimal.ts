import { z } from "zod";

/**
 * Wie z.coerce.number(), toleriert aber ein deutsches Komma als Dezimaltrennzeichen
 * (z.B. "2,5" statt "2.5"). Ohne das können manche mobilen Zahlentastaturen ein
 * Komma durchlassen, das sonst stillschweigend verworfen wird und z.B. aus "2,5"
 * die Zahl 25 macht - bei knapp bemessenen DB-Spalten (z.B. Decimal(6,3)) kann das
 * zu einem "numeric field overflow"-Absturz führen.
 *
 * Verwendung: decimalNumber.pipe(z.number().min(0).max(999.999, "zu groß"))
 */
export const decimalNumber = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(",", ".") : v),
  z.coerce.number()
);
