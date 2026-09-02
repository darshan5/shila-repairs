"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Plus, Wrench, Clock, Play, Pause, CheckCircle2, FileText, X } from "lucide-react";
import { toast } from "sonner";

type WO = {
  id: string; title: string; status: string; priority: string; source: string;
  locationName: string | null; equipmentName: string | null; createdAt: string;
  _count: { comments: number };
  invoice: { id: string; invoiceNumber: string; status: string } | null;
};

type Stats = { pending: number; approved: number; inProgress: number; deferred: number; completed: number; invoiced: number };

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  approved: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  deferred: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700",
  invoiced: "bg-teal-100 text-teal-700",
};

const PRIORITY_PILLS: Record<string, string> = {
  LOW: "bg-blue-200 text-blue-800",
  MEDIUM: "bg-amber-200 text-amber-800",
  HIGH: "bg-orange-400 text-white",
  CRITICAL: "bg-red-500 text-white",
};

const KPI_ITEMS = [
  { key: "pending", label: "Pending", icon: Clock, color: "text-slate-500" },
  { key: "approved", label: "Approved", icon: CheckCircle2, color: "text-blue-500" },
  { key: "inProgress", label: "In Progress", icon: Play, color: "text-amber-500" },
  { key: "deferred", label: "Deferred", icon: Pause, color: "text-purple-500" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-500" },
  { key: "invoiced", label: "Invoiced", icon: FileText, color: "text-teal-500" },
];

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WO[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, inProgress: 0, deferred: 0, completed: 0, invoiced: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", description: "", priority: "MEDIUM", locationName: "", equipmentName: "", estimatedCost: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchWorkOrders(); fetchStats(); }, [statusFilter, priorityFilter]);

  async function fetchWorkOrders() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    const res = await fetch(`/api/work-orders?${params}`);
    if (res.ok) { const { data } = await res.json(); setWorkOrders(data); }
    setLoading(false);
  }

  async function fetchStats() {
    const res = await fetch("/api/work-orders?stats=true");
    if (res.ok) { const { data } = await res.json(); if (data.pending !== undefined) setStats(data); }
  }

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/sync", { method: "POST" });
    setSyncing(false);
    if (res.ok) {
      const { data } = await res.json();
      toast.success(`Synced: ${data.synced || 0} work orders`);
      fetchWorkOrders(); fetchStats();
    } else {
      const { error } = await res.json();
      toast.error(error || "Sync failed");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setSubmitting(true);
    const payload: any = { title: createForm.title, priority: createForm.priority };
    if (createForm.description) payload.description = createForm.description;
    if (createForm.locationName) payload.locationName = createForm.locationName;
    if (createForm.equipmentName) payload.equipmentName = createForm.equipmentName;
    if (createForm.estimatedCost) payload.estimatedCost = parseFloat(createForm.estimatedCost);
    if (createForm.notes) payload.notes = createForm.notes;

    const res = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Work order created");
      setCreateOpen(false);
      setCreateForm({ title: "", description: "", priority: "MEDIUM", locationName: "", equipmentName: "", estimatedCost: "", notes: "" });
      fetchWorkOrders(); fetchStats();
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-sm text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600">
            <Plus className="h-3.5 w-3.5" />
            New Work Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {KPI_ITEMS.map(kpi => {
          const Icon = kpi.icon;
          const val = stats[kpi.key as keyof Stats] ?? 0;
          return (
            <div key={kpi.key} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                {kpi.label}
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{val}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-amber-500" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="deferred">Deferred</option>
          <option value="completed">Completed</option>
          <option value="invoiced">Invoiced</option>
        </select>
        <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-amber-500" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>

      {/* Work Order List */}
      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : workOrders.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
          <Wrench className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No work orders found.
        </div>
      ) : (
        <div className="space-y-2">
          {workOrders.map(wo => (
            <Link key={wo.id} href={`/work-orders/${wo.id}`} className="block">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-slate-900">{wo.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLORS[wo.status]}`}>
                      {wo.status.replace("_", " ")}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_PILLS[wo.priority]}`}>
                      {wo.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    {wo.locationName && <span>{wo.locationName}</span>}
                    {wo.equipmentName && <span className="flex items-center gap-0.5"><Wrench className="h-3 w-3" />{wo.equipmentName}</span>}
                    <span>{formatDate(wo.createdAt)}</span>
                    {wo.source === "walkthefloor" && <span className="text-amber-600 font-medium">WTF</span>}
                    {wo.invoice && <span className="text-teal-600"><FileText className="h-3 w-3 inline" /> #{wo.invoice.invoiceNumber}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Work Order Panel */}
      {createOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setCreateOpen(false)} />
          <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 z-50 md:w-full md:max-w-lg bg-white md:border-l md:shadow-xl overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">New Work Order</h2>
                <button onClick={() => setCreateOpen(false)} className="p-1 rounded hover:bg-slate-100">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Title *</label>
                  <input
                    value={createForm.title}
                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="e.g., Walk-in cooler not cooling"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Details about the issue..."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Priority</label>
                    <select
                      value={createForm.priority}
                      onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Estimated Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="$0.00"
                      value={createForm.estimatedCost}
                      onChange={e => setCreateForm({ ...createForm, estimatedCost: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Location</label>
                    <input
                      value={createForm.locationName}
                      onChange={e => setCreateForm({ ...createForm, locationName: e.target.value })}
                      placeholder="e.g., Main Store"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Equipment</label>
                    <input
                      value={createForm.equipmentName}
                      onChange={e => setCreateForm({ ...createForm, equipmentName: e.target.value })}
                      placeholder="e.g., Walk-in Cooler"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !createForm.title.trim()}
                  className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Work Order"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
