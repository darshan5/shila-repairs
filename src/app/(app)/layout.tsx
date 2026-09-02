import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  CheckSquare,
  Settings,
} from "lucide-react";

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
      <aside className="hidden w-56 shrink-0 border-r bg-gray-50 md:block">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Wrench className="h-5 w-5 text-blue-600" />
            <span>Shila Repairs</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gray-200"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
          <span className="text-sm font-medium">{session.user.name}</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
