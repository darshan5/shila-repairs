import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  CheckSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { BottomNav, MobileHeader } from "@/components/mobile-nav";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Work Orders", href: "/work-orders", icon: Wrench },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Wrench className="h-5 w-5 text-amber-600" />
          <Link href="/dashboard" className="font-bold text-slate-800">
            Shila Repairs
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="px-3 py-2 text-xs text-slate-400">Signed in as</div>
          <div className="px-3 text-sm font-medium text-slate-700">
            {session.user.name}
          </div>
          <Link
            href="/api/auth/signout"
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center border-b border-slate-200 bg-white px-4 md:px-6">
          <MobileHeader userName={session.user.name || "User"} />
          <div className="hidden md:block">
            <span className="text-sm font-medium text-slate-600">
              {session.user.name}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-16 md:pb-0">
          <div className="mx-auto max-w-6xl p-4 md:p-6">{children}</div>
        </main>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
}
