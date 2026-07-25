import {
  LayoutDashboard,
  Boxes,
  Printer,
  Calculator,
  Package,
  Users,
  ClipboardList,
  FileText,
  FileSignature,
  Truck,
  Ticket,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventar/material", label: "Material", icon: Boxes },
  { href: "/inventar/geraete", label: "Geräte", icon: Printer },
  { href: "/kalkulator", label: "Kalkulator", icon: Calculator },
  { href: "/produkte", label: "Produkte", icon: Package },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/bestellungen", label: "Bestellungen", icon: ClipboardList },
  { href: "/versand", label: "Versand", icon: Truck },
  { href: "/rechnungen", label: "Rechnungen", icon: FileText },
  { href: "/angebote", label: "Angebote", icon: FileSignature },
  { href: "/gutscheine", label: "Gutscheine", icon: Ticket },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];
