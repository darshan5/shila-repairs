"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  Building2,
} from "lucide-react";

const bottomTabs = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/work-orders", icon: Wrench },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Invoices", href: "/invoices", icon: FileText },
];

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Work Orders", href: "/work-orders", icon: Wrench },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Clients", href: "/clients", icon: Building2 },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Users", href: "/users", icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden">
      <div className="flex items-center justify-around">
        {bottomTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
                isActive ? "text-amber-600" : "text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader({ userName }: { userName: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-md p-1.5 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>
      </div>

      <div className="flex-1 text-center md:hidden">
        <div className="flex items-center justify-center gap-1.5">
          <Wrench className="h-4 w-4 text-amber-600" />
          <span className="font-bold text-slate-800">Shila Repairs</span>
        </div>
      </div>

      <span className="text-sm font-medium text-slate-600 md:hidden">{userName}</span>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-amber-600" />
                <span className="font-bold text-slate-800">Shila Repairs</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1 hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-3">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-amber-50 text-amber-700 font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-3">
              <div className="px-3 py-2 text-xs text-slate-400">
                Signed in as
              </div>
              <div className="px-3 text-sm font-medium text-slate-700">
                {userName}
              </div>
              <Link
                href="/api/auth/signout"
                onClick={() => setMenuOpen(false)}
                className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
