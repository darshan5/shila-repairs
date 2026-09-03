"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Phone, Mail, Wrench, Power } from "lucide-react";
import { toast } from "sonner";

type WOSummary = { id: string; title: string; status: string; priority: string; createdAt: string };
type ClientDetail = {
  id: string; name: string; corporationName: string | null; storeNumber: string | null;
  address: string | null; city: string | null; state: string | null; zipCode: string | null;
  phone: string | null; email: string | null;
  billingName: string | null; billingAddress: string | null; billingCity: string | null;
  billingState: string | null; billingZip: string | null; billingPhone: string | null; billingEmail: string | null;
  notes: string | null; isActive: boolean;
  _count: { workOrders: number }; workOrders: WOSummary[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700", approved: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800", deferred: "bg-purple-100 text-purple-700",
  completed: "bg-emerald-100 text-emerald-700", invoiced: "bg-teal-100 text-teal-700",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchClient(); }, [id]);

  async function fetchClient() {
    setLoading(true);
    const res = await fetch(`/api/clients/${id}`);
    if (res.ok) { const { data } = await res.json(); setClient(data); }
    else { toast.error("Client not found"); router.push("/clients"); }
    setLoading(false);
  }

  function openEdit() {
    if (!client) return;
    setForm({
      name: client.name, corporationName: client.corporationName || "", storeNumber: client.storeNumber || "",
      address: client.address || "", city: client.city || "", state: client.state || "", zipCode: client.zipCode || "",
      phone: client.phone || "", email: client.email || "",
      billingName: client.billingName || "", billingAddress: client.billingAddress || "",
      billingCity: client.billingCity || "", billingState: client.billingState || "", billingZip: client.billingZip || "",
      billingPhone: client.billingPhone || "", billingEmail: client.billingEmail || "", notes: client.notes || "",
    });
    setEditing(true);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { toast.success("Client updated"); setEditing(false); fetchClient(); }
    else { const { error } = await res.json(); toast.error(error); }
  }

  async function handleToggleActive() {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success(client?.isActive ? "Client deactivated" : "Client reactivated"); fetchClient(); }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading || !client) return <p className="py-8 text-center text-slate-400">Loading...</p>;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start gap-3">
        <button onClick={() => router.push("/clients")} className="mt-1 rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
            {client.storeNumber && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">#{client.storeNumber}</span>}
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${client.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {client.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {client.corporationName && <p className="text-sm text-slate-500 mt-0.5">{client.corporationName}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={openEdit} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">Edit</button>
          <button onClick={handleToggleActive} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
            <Power className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-amber-800">Edit Client</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-slate-700">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
            <div><label className="text-sm text-slate-700">Corporation</label><input value={form.corporationName} onChange={e => setForm({ ...form, corporationName: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
          </div>
          <div><label className="text-sm text-slate-700">Store Number</label><input value={form.storeNumber} onChange={e => setForm({ ...form, storeNumber: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
          <div><label className="text-sm text-slate-700">Address</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm text-slate-700">City</label><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
            <div><label className="text-sm text-slate-700">State</label><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
            <div><label className="text-sm text-slate-700">Zip</label><input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-slate-700">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
            <div><label className="text-sm text-slate-700">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Billing</p>
          <div><label className="text-sm text-slate-700">Billing Name</label><input value={form.billingName} onChange={e => setForm({ ...form, billingName: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" /></div>
          <div><label className="text-sm text-slate-700">Billing Address</label><input value={form.billingAddress} onChange={e => setForm({ ...form, billingAddress: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm text-slate-700">City</label><input value={form.billingCity} onChange={e => setForm({ ...form, billingCity: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" /></div>
            <div><label className="text-sm text-slate-700">State</label><input value={form.billingState} onChange={e => setForm({ ...form, billingState: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" /></div>
            <div><label className="text-sm text-slate-700">Zip</label><input value={form.billingZip} onChange={e => setForm({ ...form, billingZip: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-slate-700">Billing Phone</label><input value={form.billingPhone} onChange={e => setForm({ ...form, billingPhone: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" /></div>
            <div><label className="text-sm text-slate-700">Billing Email</label><input value={form.billingEmail} onChange={e => setForm({ ...form, billingEmail: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" /></div>
          </div>
          <div><label className="text-sm text-slate-700">Notes</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-amber-500" /></div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !form.name?.trim()} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Location Info</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {client.address && <div className="col-span-2"><p className="text-xs text-slate-400">Address</p><p className="text-slate-800 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{[client.address, client.city, client.state && client.zipCode ? `${client.state} ${client.zipCode}` : client.state || client.zipCode].filter(Boolean).join(", ")}</p></div>}
              {client.phone && <div><p className="text-xs text-slate-400">Phone</p><p className="text-slate-800 flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-400" />{client.phone}</p></div>}
              {client.email && <div><p className="text-xs text-slate-400">Email</p><p className="text-slate-800 flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-400" />{client.email}</p></div>}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Billing Info</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {client.billingName && <div className="col-span-2"><p className="text-xs text-slate-400">Billing Name</p><p className="font-medium text-slate-800">{client.billingName}</p></div>}
              {client.billingAddress && <div className="col-span-2"><p className="text-xs text-slate-400">Billing Address</p><p className="text-slate-800">{[client.billingAddress, client.billingCity, client.billingState && client.billingZip ? `${client.billingState} ${client.billingZip}` : client.billingState || client.billingZip].filter(Boolean).join(", ")}</p></div>}
              {client.billingPhone && <div><p className="text-xs text-slate-400">Phone</p><p className="text-slate-800">{client.billingPhone}</p></div>}
              {client.billingEmail && <div><p className="text-xs text-slate-400">Email</p><p className="text-slate-800">{client.billingEmail}</p></div>}
              {!client.billingName && !client.billingAddress && <p className="text-slate-400 col-span-2">No billing info set</p>}
            </div>
          </div>

          {client.notes && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </>
      )}

      {/* Work Order History */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Work Orders ({client._count.workOrders})</p>
        {client.workOrders.length === 0 ? (
          <p className="text-sm text-slate-400">No work orders for this client.</p>
        ) : (
          <div className="space-y-2">
            {client.workOrders.map(wo => (
              <Link key={wo.id} href={`/work-orders/${wo.id}`} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-sm hover:bg-slate-50 transition-colors">
                <Wrench className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="flex-1 text-slate-800">{wo.title}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_COLORS[wo.status] || "bg-slate-100"}`}>{wo.status.replace("_", " ")}</span>
                <span className="text-xs text-slate-400">{formatDate(wo.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
