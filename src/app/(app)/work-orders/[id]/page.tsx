"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Wrench, MapPin, Send, FileText, Play, Pause, CheckCircle2 } from "lucide-react";

type Comment = { id: string; userId: string | null; content: string; createdAt: string };
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
  pending: "bg-slate-100 text-slate-700", approved: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700", deferred: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700", invoiced: "bg-amber-100 text-amber-700",
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

  useEffect(() => { fetchWO(); }, [id]);

  async function fetchWO() {
    setLoading(true);
    const res = await fetch(`/api/work-orders/${id}`);
    if (res.ok) { const { data } = await res.json(); setWo(data); }
    else router.push("/work-orders");
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
    if (res.ok) { fetchWO(); setDeferOpen(false); }
    else { const { error } = await res.json(); alert(error); }
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
      router.push(`/invoices/${data.id}`);
    } else {
      const { error } = await res.json();
      alert(error);
    }
  }

  if (loading || !wo) return <p className="py-8 text-center text-slate-400">Loading...</p>;

  const isTerminal = ["completed", "invoiced"].includes(wo.status);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => router.push("/work-orders")} className="rounded p-1 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{wo.title}</h1>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-slate-400">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[wo.status]}`}>{wo.status.replace("_", " ")}</span>
            <span>{wo.priority}</span>
            {wo.source === "walkthefloor" && <span className="text-amber-600 text-xs">From WalkTheFloor</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      {!isTerminal && (
        <div className="flex gap-2 flex-wrap">
          {(wo.status === "pending" || wo.status === "approved") && (
            <button onClick={() => handleStatus("in_progress")} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">
              <Play className="h-3.5 w-3.5" />Start Work
            </button>
          )}
          {wo.status !== "deferred" && (
            <button onClick={() => setDeferOpen(!deferOpen)} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
              <Pause className="h-3.5 w-3.5" />Defer
            </button>
          )}
          {wo.status === "in_progress" && (
            <button onClick={() => handleStatus("completed")} disabled={actionLoading} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              <CheckCircle2 className="h-3.5 w-3.5" />Complete
            </button>
          )}
        </div>
      )}

      {wo.status === "completed" && !wo.invoice && (
        <button onClick={handleCreateInvoice} className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700">
          <FileText className="h-3.5 w-3.5" />Create Invoice
        </button>
      )}

      {wo.invoice && (
        <Link href={`/invoices/${wo.invoice.id}`} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <FileText className="h-4 w-4 text-amber-600" />
          <span>Invoice #{wo.invoice.invoiceNumber} — {wo.invoice.status}</span>
        </Link>
      )}

      {/* Defer form */}
      {deferOpen && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium">Defer Work Order</h3>
          <div>
            <label className="text-sm text-slate-500">Expected Start Date *</label>
            <input type="date" value={deferDate} onChange={(e) => setDeferDate(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-sm text-slate-500">Reason</label>
            <textarea value={deferReason} onChange={(e) => setDeferReason(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm" rows={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleStatus("deferred", { deferredDate: deferDate, deferredReason: deferReason })} disabled={!deferDate || actionLoading} className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white disabled:opacity-50">Defer</button>
            <button onClick={() => setDeferOpen(false)} className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Deferred info */}
      {wo.status === "deferred" && wo.deferredDate && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm">
          <p className="font-medium text-purple-700">Deferred</p>
          <p className="text-purple-600">Expected start: {new Date(wo.deferredDate).toLocaleDateString()}</p>
          {wo.deferredReason && <p className="text-purple-600">{wo.deferredReason}</p>}
        </div>
      )}

      {/* Details */}
      <div className="rounded-lg border p-4 space-y-3">
        {wo.description && <p className="text-sm">{wo.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {wo.locationName && (
            <div><span className="text-slate-400">Location</span><p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{wo.locationName}</p></div>
          )}
          {wo.equipmentName && (
            <div><span className="text-slate-400">Equipment</span><p className="font-medium flex items-center gap-1"><Wrench className="h-3 w-3" />{wo.equipmentName}{wo.equipmentType && ` (${wo.equipmentType})`}</p></div>
          )}
          {wo.estimatedCost != null && (
            <div><span className="text-slate-400">Estimated Cost</span><p className="font-medium">${wo.estimatedCost.toFixed(2)}</p></div>
          )}
          {wo.actualCost != null && (
            <div><span className="text-slate-400">Actual Cost</span><p className="font-medium">${wo.actualCost.toFixed(2)}</p></div>
          )}
          <div><span className="text-slate-400">Created</span><p>{new Date(wo.createdAt).toLocaleDateString()}</p></div>
          {wo.completedAt && <div><span className="text-slate-400">Completed</span><p>{new Date(wo.completedAt).toLocaleDateString()}</p></div>}
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Comments ({wo.comments.length})</h3>
        {wo.comments.map(c => (
          <div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm">
            <p>{c.content}</p>
            <p className="mt-1 text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment..." className="flex-1 rounded-lg border px-3 py-1.5 text-sm" onKeyDown={(e) => e.key === "Enter" && handleComment()} />
          <button onClick={handleComment} disabled={sending || !comment.trim()} className="rounded-lg bg-amber-500 px-3 py-1.5 text-white disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
