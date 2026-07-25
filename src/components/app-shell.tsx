"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "@/components/nav-items";
import { NavLink } from "@/components/nav-link";

export function AppShell({
  orgName,
  userName,
  onSignOut,
  children,
}: {
  orgName: string;
  userName: string;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-sidebar">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          {orgName}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 truncate px-1 text-xs text-muted-foreground">
            {userName}
          </div>
          <form action={onSignOut}>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" type="submit">
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" />}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle>{orgName}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {navItems.map((item) => (
                  <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
                ))}
              </nav>
              <div className="border-t p-3">
                <div className="mb-2 truncate px-1 text-xs text-muted-foreground">
                  {userName}
                </div>
                <form action={onSignOut}>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2" type="submit">
                    <LogOut className="h-4 w-4" />
                    Abmelden
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">{orgName}</span>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
