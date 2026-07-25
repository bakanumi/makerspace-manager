"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/nav-items";

export function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}
