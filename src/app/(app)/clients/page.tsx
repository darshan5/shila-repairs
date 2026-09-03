"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2, Phone, MapPin, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type ClientRow = {
  id: string; name: string; corporationName: string | null; storeNumber: string | null;
  city: string | null; state: string | null; phone: string | null; isActive: boolean;
  _count: { workOrders: number };
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [form, setForm] = useState({
    name: "", corporationName: "", storeNumber: "",
    address: "", city: "", state: "PA", zipCode: "", phone: "", email: "",
    billingName: "", billingAddress: "", billingCity: "", billingState: "PA", billingZip: "",
    billingPhone: "", billingEmail: "", notes: "",
  });

  useEffect(() => { fetchClients(); }, [page, search]);

  async function fetchClients() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/clients?${params}`);
    if (res.ok) {
      const d = await res.json();
      setClients(d.data);
      setTotal(d.total);
      setTotalPages(d.totalPages);
    }
    setLoading(false);
  }

  function handleSameAs(checked: boolean) {
    setSameAsBilling(checked);
    if (checked) {
      setForm(f => ({
        ...f,
        billingName: f.corporationName || f.name,
        billingAddress: f.address, billingCity: f.city, billingState: f.state, billingZip: f.zipCode,
        billingPhone: f.phone, billingEmail: f.email,
      }));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload: any = { name: form.name };
    const fields = ["corporationName","storeNumber","address","city","state","zipCode","phone","email","billingName","billingAddress","billingCity","billingState","billingZip","billingPhone","billingEmail","notes"] as const;
    for (const f of fields) { if (form[f]) payload[f] = form[f]; }

    const res = await fetch("/api/clients", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Client created");
      setCreateOpen(false);
      setForm({ name: "", corporationName: "", storeNumber: "", address: "", city: "", state: "PA", zipCode: "", phone: "", email: "", billingName: "", billingAddress: "", billingCity: "", billingState: "PA", billingZip: "", billingPhone: "", billingEmail: "", notes: "" });
      fetchClients();
    } else {
      const { error } = await res.json();
      toast.error(error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
        <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600">
          <Plus className="h-3.5 w-3.5" />New Client
        </button>
      </div>

      <div className="relative max-w-md">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search clients..." className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20" />
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : clients.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
          <Building2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No clients found.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {clients.map(c => (
              <Link key={c.id} href={`/clients/${c.id}`} className="block">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-900">{c.name}</span>
                      {c.corporationName && <span className="text-xs text-slate-500">{c.corporationName}</span>}
                      {c.storeNumber && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">#{c.storeNumber}</span>}
                      {!c.isActive && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">Inactive</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      {c.city && c.state && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.city}, {c.state}</span>}
                      {c.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{c.phone}</span>}
                      <span>{c._count.workOrders} work orders</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" />Prev
              </button>
              <span className="text-sm text-slate-500">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50">
                Next<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Client Panel */}
      {createOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setCreateOpen(false)} />
          <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 z-50 md:w-full md:max-w-lg bg-white md:border-l md:shadow-xl overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">New Client</h2>
                <button onClick={() => setCreateOpen(false)} className="p-1 rounded hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Corporation Name</label>
                    <input value={form.corporationName} onChange={e => setForm({ ...form, corporationName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Store Number</label>
                    <input value={form.storeNumber} onChange={e => setForm({ ...form, storeNumber: e.target.value })} placeholder="For WalkTheFloor sync" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pt-2">Location</p>
                <div>
                  <label className="text-sm font-medium text-slate-700">Address</label>
                  <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">City</label>
                    <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">State</label>
                    <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Zip</label>
                    <input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Billing</p>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer ml-auto">
                    <input type="checkbox" checked={sameAsBilling} onChange={e => handleSameAs(e.target.checked)} className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                    Same as location
                  </label>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Billing Name</label>
                  <input value={form.billingName} onChange={e => setForm({ ...form, billingName: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Billing Address</label>
                  <input value={form.billingAddress} onChange={e => setForm({ ...form, billingAddress: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">City</label>
                    <input value={form.billingCity} onChange={e => setForm({ ...form, billingCity: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">State</label>
                    <input value={form.billingState} onChange={e => setForm({ ...form, billingState: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Zip</label>
                    <input value={form.billingZip} onChange={e => setForm({ ...form, billingZip: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Billing Phone</label>
                    <input value={form.billingPhone} onChange={e => setForm({ ...form, billingPhone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Billing Email</label>
                    <input type="email" value={form.billingEmail} onChange={e => setForm({ ...form, billingEmail: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 bg-slate-50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500" />
                </div>
                <button type="submit" disabled={saving || !form.name.trim()} className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50">
                  {saving ? "Creating..." : "Create Client"}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
