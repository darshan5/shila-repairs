"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, Wrench, MapPin, Send, FileText,
  Play, Pause, CheckCircle2, DollarSign, X, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Comment = { id: string; userId: string | null; userName: string | null; content: string; createdAt: string };
type WODetail = {
  id: string; title: string; description: string | null; priority: string; status: string;
  source: string; locationName: string | null; equipmentName: string | null; equipmentType: string | null;
  assignedTo: string | null; deferredDate: string | null; deferredReason: string | null;
  estimatedCost: number | null; actualCost: number | null; notes: string | null;
  completedAt: string | null; createdAt: string; externalId: string | null;
  comments: Comment[];
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

const PRIORITY_PILLS: Record<string, string> = {
  LOW: "bg-blue-200 text-blue-800",
  MEDIUM: "bg-amber-200 text-amber-800",
  HIGH: "bg-orange-400 text-white",
  CRITICAL: "bg-red-500 text-white",
};

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [wo, setWo] = useState<WODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [deferOpen, setDeferOpen] = useState(false);
  const [deferDate, setDeferDate] = useState("");
  const [deferReason, setDeferReason] = useState("");

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeActualCost, setCompleteActualCost] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "MEDIUM", locationName: "", equipmentName: "", estimatedCost: "", notes: "" });

  useEffect(() => { fetchWO(); }, [id]);

  async function fetchWO() {
    setLoading(true);
    const res = await fetch(`/api/work-orders/${id}`);
    if (res.ok) { const { data } = await res.json(); setWo(data); }
    else { toast.error("Work order not found"); router.push("/work-orders"); }
    setLoading(false);
  }

  async function handleStatus(status: string, data?: any) {
    setActionLoading(true);
    const res = await fetch(`/api/work-orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...data }),
    });
    setActionLoading(false);
    if (res.ok) {
      toast.success(status === "in_progress" ? "Work started" : status === "deferred" ? "Deferred" : "Completed");
      fetchWO(); setDeferOpen(false); setCompleteOpen(false);
    } else {
      const { error } = await res.json();
      toast.error(error);
    }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setSending(true);
    await fetch(`/api/work-orders/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    setSending(false);
    setComment("");
    toast.success("Comment added");
    fetchWO();
  }

  async function handleCreateInvoice() {
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workOrderId: id }),
    });
    if (res.ok) {
      const { data } = await res.json();
      toast.success("Invoice created");
      router.push(`/invoices/${data.id}`);
    } else {
      const { error } = await res.json();
      toast.error(error);
    }
  }

  function openEdit() {
    if (!wo) return;
    setEditForm({
      title: wo.title, description: wo.description || "", priority: wo.priority,
      locationName: wo.locationName || "", equipmentName: wo.equipmentName || "",
      estimatedCost: wo.estimatedCost?.toString() || "", notes: wo.notes || "",
    });
    setEditOpen(true);
  }

  async function handleEditSave() {
    setActionLoading(true);
    const payload: any = {
      title: editForm.title, description: editForm.description || null,
      priority: editForm.priority, locationName: editForm.locationName || null,
      equipmentName: editForm.equipmentName || null, notes: editForm.notes || null,
    };
    if (editForm.estimatedCost) payload.estimatedCost = parseFloat(editForm.estimatedCost);
    const res = await fetch(`/api/work-orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setActionLoading(false);
    if (res.ok) { toast.success("Updated"); setEditOpen(false); fetchWO(); }
    else { const { error } = await res.json(); toast.error(error); }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading || !wo) return <p className="py-8 text-center text-slate-400">Loading...</p>;

  const isTerminal = ["completed", "invoiced"].includes(wo.status);

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.push("/work-orders")} className="mt-1 rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900">{wo.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[wo.status]}`}>
              {wo.status.replace("_", " ")}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_PILLS[wo.priority]}`}>
              {wo.priority}
            </span>
            {wo.source === "walkthefloor" && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                <ExternalLink className="h-3 w-3" />From WalkTheFloor
              </span>
            )}
            {wo.source === "local" && (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Local</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isTerminal && (
        <div className="flex gap-2 flex-wrap">
          {(wo.status === "pending" || wo.status === "approved") && (
            <button onClick={() => handleStatus("in_progress")} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:opacity-50">
              <Play className="h-4 w-4" />Start Work
            </button>
          )}
          {wo.status === "deferred" && (
            <button onClick={() => handleStatus("in_progress")} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:opacity-50">
              <Play className="h-4 w-4" />Resume
            </button>
          )}
          {wo.status !== "deferred" && (
            <button onClick={() => setDeferOpen(!deferOpen)} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <Pause className="h-4 w-4" />Defer
            </button>
          )}
          {(wo.status === "in_progress" || wo.status === "approved" || wo.status === "pending") && (
            <button onClick={() => setCompleteOpen(!completeOpen)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" />Complete
            </button>
          )}
          <button onClick={openEdit} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Edit Details
          </button>
        </div>
      )}

      {/* Invoice link or create */}
      {wo.status === "completed" && !wo.invoice && (
        <button onClick={handleCreateInvoice} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600">
          <FileText className="h-4 w-4" />Create Invoice
        </button>
      )}
      {wo.invoice && (
        <Link href={`/invoices/${wo.invoice.id}`} className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm hover:bg-teal-100 transition-colors">
          <FileText className="h-4 w-4 text-teal-600" />
          <span className="text-teal-800 font-medium">Invoice #{wo.invoice.invoiceNumber}</span>
          <span className="text-teal-600 capitalize text-xs">— {wo.invoice.status}</span>
        </Link>
      )}

      {/* Defer form */}
      {deferOpen && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-purple-800">Defer Work Order</h3>
          <div>
            <label className="text-sm text-purple-700">Expected Start Date *</label>
            <input type="date" value={deferDate} onChange={e => setDeferDate(e.target.value)} className="mt-1 w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-400" />
          </div>
          <div>
            <label className="text-sm text-purple-700">Reason</label>
            <textarea value={deferReason} onChange={e => setDeferReason(e.target.value)} className="mt-1 w-full rounded-lg border border-purple-200 px-3 py-2 text-sm outline-none focus:border-purple-400" rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleStatus("deferred", { deferredDate: deferDate, deferredReason: deferReason })} disabled={!deferDate || actionLoading} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">Defer</button>
            <button onClick={() => setDeferOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Complete form */}
      {completeOpen && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-800">Complete Work Order</h3>
          <div>
            <label className="text-sm text-emerald-700">Actual Cost *</label>
            <input type="number" min="0" step="0.01" placeholder="$0.00" value={completeActualCost} onChange={e => setCompleteActualCost(e.target.value)} className="mt-1 w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-sm text-emerald-700">Completion Notes *</label>
            <textarea value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} placeholder="Describe work done..." className="mt-1 w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-400" rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleStatus("completed", { actualCost: parseFloat(completeActualCost), notes: completeNotes })} disabled={!completeActualCost || !completeNotes.trim() || actionLoading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Complete</button>
            <button onClick={() => setCompleteOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Deferred info */}
      {wo.status === "deferred" && wo.deferredDate && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
          <p className="text-sm font-medium text-purple-800">Deferred</p>
          <p className="text-sm text-purple-700">Expected start: {formatDate(wo.deferredDate)}</p>
          {wo.deferredReason && <p className="text-sm text-purple-600 mt-0.5">{wo.deferredReason}</p>}
        </div>
      )}

      {/* Edit Form */}
      {editOpen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-800">Edit Work Order</h3>
          <div>
            <label className="text-sm text-slate-700">Title</label>
            <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Description</label>
            <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-700">Priority</label>
              <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-700">Estimated Cost</label>
              <input type="number" min="0" step="0.01" value={editForm.estimatedCost} onChange={e => setEditForm({ ...editForm, estimatedCost: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-700">Location</label>
              <input value={editForm.locationName} onChange={e => setEditForm({ ...editForm, locationName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="text-sm text-slate-700">Equipment</label>
              <input value={editForm.equipmentName} onChange={e => setEditForm({ ...editForm, equipmentName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-700">Notes</label>
            <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleEditSave} disabled={!editForm.title.trim() || actionLoading} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">Save</button>
            <button onClick={() => setEditOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        {wo.description && (
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{wo.description}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {wo.locationName && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Location</p>
              <p className="font-medium text-slate-800 flex items-center gap-1 mt-0.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{wo.locationName}</p>
            </div>
          )}
          {wo.equipmentName && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Equipment</p>
              <p className="font-medium text-slate-800 flex items-center gap-1 mt-0.5"><Wrench className="h-3.5 w-3.5 text-slate-400" />{wo.equipmentName}{wo.equipmentType && ` (${wo.equipmentType})`}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Created</p>
            <p className="text-slate-700 mt-0.5">{formatDate(wo.createdAt)}</p>
          </div>
          {wo.completedAt && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Completed</p>
              <p className="text-slate-700 mt-0.5">{formatDate(wo.completedAt)}</p>
            </div>
          )}
        </div>

        {/* Cost section */}
        {(wo.estimatedCost != null || wo.actualCost != null) && (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><DollarSign className="h-3 w-3" />Cost</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Estimated</p>
                <p className="font-semibold text-slate-800">{wo.estimatedCost != null ? `$${wo.estimatedCost.toFixed(2)}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Actual</p>
                <p className="font-semibold text-slate-800">{wo.actualCost != null ? `$${wo.actualCost.toFixed(2)}` : "—"}</p>
              </div>
            </div>
          </div>
        )}

        {wo.notes && (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Notes</p>
            <p className="text-sm text-slate-700 mt-0.5">{wo.notes}</p>
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Activity ({wo.comments.length})</h3>
        {wo.comments.length === 0 ? (
          <p className="text-sm text-slate-400">No comments yet.</p>
        ) : (
          <div className="space-y-2">
            {wo.comments.map(c => (
              <div key={c.id} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-700">{c.content}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {c.userName && <span className="font-medium text-slate-500">{c.userName} &middot; </span>}
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
            onKeyDown={e => e.key === "Enter" && handleComment()}
          />
          <button onClick={handleComment} disabled={sending || !comment.trim()} className="rounded-lg bg-amber-500 px-3 py-2 text-white shadow-sm hover:bg-amber-600 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
