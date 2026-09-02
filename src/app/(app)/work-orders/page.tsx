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
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>

      {creating && (
        <div className="flex gap-2 rounded-lg border p-3">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Work order title..."
            className="flex-1 rounded-md border px-3 py-1.5 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white">Create</button>
          <button onClick={() => setCreating(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
        </div>
      )}

      <div className="flex gap-2">
        <select className="rounded-md border px-3 py-1.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="deferred">Deferred</option>
          <option value="completed">Completed</option>
          <option value="invoiced">Invoiced</option>
        </select>
        <select className="rounded-md border px-3 py-1.5 text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-gray-500">Loading...</p>
      ) : workOrders.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-gray-500">
          <Wrench className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No work orders found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Title</th>
                <th className="px-3 py-2 text-left font-medium">Location</th>
                <th className="px-3 py-2 text-left font-medium">Equipment</th>
                <th className="px-3 py-2 text-center font-medium">Priority</th>
                <th className="px-3 py-2 text-center font-medium">Status</th>
                <th className="px-3 py-2 text-center font-medium">Source</th>
                <th className="px-3 py-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(wo => (
                <tr key={wo.id} className="border-b last:border-b-0 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/work-orders/${wo.id}`} className="font-medium text-blue-600 hover:underline">{wo.title}</Link>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{wo.locationName || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{wo.equipmentName || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[wo.priority]}`}>{wo.priority}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[wo.status]}`}>{wo.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`text-xs ${wo.source === "walkthefloor" ? "text-blue-600" : "text-gray-500"}`}>
                      {wo.source === "walkthefloor" ? "WTF" : "Local"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500">{new Date(wo.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
