"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Plus, Wrench } from "lucide-react";

type WO = {
  id: string; title: string; status: string; priority: string; source: string;
  locationName: string | null; equipmentName: string | null; createdAt: string;
  _count: { comments: number };
  invoice: { id: string; invoiceNumber: string; status: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  approved: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  deferred: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  invoiced: "bg-teal-100 text-teal-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-200 text-orange-800",
  CRITICAL: "bg-red-200 text-red-800",
};

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => { fetchWorkOrders(); }, [statusFilter, priorityFilter]);

  async function fetchWorkOrders() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const res = await fetch(`/api/work-orders?${params}`);
    if (res.ok) { const { data } = await res.json(); setWorkOrders(data); }
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/sync", { method: "POST" });
    setSyncing(false);
    if (res.ok) { fetchWorkOrders(); }
    else { const { error } = await res.json(); alert(error); }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    if (res.ok) { setNewTitle(""); setCreating(false); fetchWorkOrders(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600">
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>

      {creating && (
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Work order title..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-amber-500"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600">Create</button>
          <button onClick={() => setCreating(false)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
      )}

      <div className="flex gap-2">
        <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-amber-500" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="deferred">Deferred</option>
          <option value="completed">Completed</option>
          <option value="invoiced">Invoiced</option>
        </select>
        <select className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-amber-500" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : workOrders.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
          <Wrench className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No work orders found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Location</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Equipment</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Source</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(wo => (
                <tr key={wo.id} className="border-b border-slate-100 last:border-b-0 transition-colors hover:bg-amber-50/40">
                  <td className="px-3 py-2.5">
                    <Link href={`/work-orders/${wo.id}`} className="font-medium text-slate-900 hover:text-amber-600 hover:underline">{wo.title}</Link>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{wo.locationName || "—"}</td>
                  <td className="px-3 py-2.5 text-slate-500">{wo.equipmentName || "—"}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[wo.priority]}`}>{wo.priority}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[wo.status]}`}>{wo.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-medium ${wo.source === "walkthefloor" ? "text-amber-600" : "text-slate-400"}`}>
                      {wo.source === "walkthefloor" ? "WTF" : "Local"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-400">{new Date(wo.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
