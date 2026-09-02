"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, RefreshCw, Clock, AlertTriangle, CheckCircle2, FileText, Pause } from "lucide-react";

type Stats = { pending: number; approved: number; inProgress: number; deferred: number; completed: number; invoiced: number };
type WO = { id: string; title: string; status: string; priority: string; locationName: string | null; createdAt: string };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  approved: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  deferred: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  invoiced: "bg-amber-100 text-amber-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<WO[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    fetch("/api/settings").then(r => r.json()).then(d => setLastSync(d.data?.lastSyncAt));
  }, []);

  async function fetchData() {
    const [woRes] = await Promise.all([
      fetch("/api/work-orders"),
    ]);
    if (woRes.ok) {
      const { data } = await woRes.json();
      setRecent(data.slice(0, 10));
      const s: Stats = { pending: 0, approved: 0, inProgress: 0, deferred: 0, completed: 0, invoiced: 0 };
      data.forEach((wo: WO) => {
        if (wo.status === "pending") s.pending++;
        else if (wo.status === "approved") s.approved++;
        else if (wo.status === "in_progress") s.inProgress++;
        else if (wo.status === "deferred") s.deferred++;
        else if (wo.status === "completed") s.completed++;
        else if (wo.status === "invoiced") s.invoiced++;
      });
      setStats(s);
    }
  }

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/sync", { method: "POST" });
    setSyncing(false);
    if (res.ok) {
      const { data } = await res.json();
      alert(`Synced ${data.synced} work orders (${data.skipped} skipped)`);
      fetchData();
      setLastSync(new Date().toISOString());
    } else {
      const { error } = await res.json();
      alert(error);
    }
  }

  const kpis = stats ? [
    { label: "Pending", value: stats.pending + stats.approved, icon: Clock, color: "text-gray-600" },
    { label: "In Progress", value: stats.inProgress, icon: Wrench, color: "text-blue-600" },
    { label: "Deferred", value: stats.deferred, icon: Pause, color: "text-purple-600" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Invoiced", value: stats.invoiced, icon: FileText, color: "text-amber-600" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          {lastSync && <span className="text-xs text-gray-500">Last sync: {new Date(lastSync).toLocaleString()}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {kpis.map(kpi => (
            <div key={kpi.label} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-xs text-gray-500">{kpi.label}</span>
              </div>
              <p className="mt-1 text-2xl font-bold">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Work Orders</h2>
        {recent.length === 0 ? (
          <div className="rounded-lg border p-8 text-center text-gray-500">
            No work orders yet. Click Sync to pull from WalkTheFloor.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(wo => (
              <Link key={wo.id} href={`/work-orders/${wo.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                <div>
                  <span className="text-sm font-medium">{wo.title}</span>
                  {wo.locationName && <span className="ml-2 text-xs text-gray-500">{wo.locationName}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[wo.priority] || "bg-gray-100"}`}>{wo.priority}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[wo.status] || "bg-gray-100"}`}>{wo.status.replace("_", " ")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
