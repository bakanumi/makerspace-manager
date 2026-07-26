const knownHexNames: Record<string, string> = {
  "#000000": "Schwarz",
  "#ffffff": "Weiß",
  "#ff0000": "Rot",
  "#00ff00": "Grün",
  "#008000": "Grün",
  "#0000ff": "Blau",
  "#ffff00": "Gelb",
  "#ffa500": "Orange",
  "#ffc0cb": "Rosa",
  "#800080": "Lila",
  "#a52a2a": "Braun",
  "#808080": "Grau",
  "#c0c0c0": "Silber",
  "#00ffff": "Türkis",
  "#ff00ff": "Magenta",
  "#ffd700": "Gold",
  "#000080": "Marineblau",
};

export const isHexColor = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

/** Textlabel für eine Farbe: Freitext unverändert, bekannte Hex-Werte als Name, unbekannte Hex-Werte als null (nur Punkt anzeigen). */
export function colorLabel(value: string): string | null {
  if (!isHexColor(value)) return value;
  return knownHexNames[value.toLowerCase()] ?? null;
}
