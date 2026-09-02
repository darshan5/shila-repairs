"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";

type Invoice = {
  id: string; invoiceNumber: string; status: string; total: number; createdAt: string;
  workOrder: { title: string; locationName: string | null };
};

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  finalized: "bg-green-100 text-green-700",
  void: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { setPage(1); }, [search, sortBy]);
  useEffect(() => { fetchInvoices(); }, [page, search, sortBy]);

  async function fetchInvoices() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "10", sortBy });
    if (search) params.set("search", search);
    const res = await fetch(`/api/invoices?${params}`);
    if (res.ok) {
      const result = await res.json();
      setInvoices(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    }
    setLoading(false);
  }

  const activeTotal = invoices.filter(i => i.status !== "void").reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <span className="text-sm text-slate-500">{total} invoice{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by invoice #, work order, customer..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="total">Highest Total</option>
          <option value="status">By Status</option>
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
          <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
          {search ? "No invoices match your search." : "No invoices yet. Complete a work order to create one."}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Invoice #</th>
                  <th className="px-3 py-2 text-left font-medium">Work Order</th>
                  <th className="px-3 py-2 text-left font-medium">Location</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className={`border-b last:border-b-0 hover:bg-slate-50 ${inv.status === "void" ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-amber-600 hover:underline">{inv.invoiceNumber}</Link>
                    </td>
                    <td className="px-3 py-2">{inv.workOrder.title}</td>
                    <td className="px-3 py-2 text-slate-500">{inv.workOrder.locationName || "—"}</td>
                    <td className={`px-3 py-2 text-right font-medium ${inv.status === "void" ? "line-through text-red-400" : ""}`}>${inv.total.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[inv.status] || "bg-slate-100"}`}>{inv.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-2 md:hidden">
            {invoices.map(inv => (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className={`block rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:bg-slate-50 ${inv.status === "void" ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-amber-600">{inv.invoiceNumber}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[inv.status] || "bg-slate-100"}`}>{inv.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{inv.workOrder.title}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{inv.workOrder.locationName || "—"}</span>
                  <span className={`font-medium ${inv.status === "void" ? "line-through text-red-400" : "text-slate-700"}`}>${inv.total.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />Prev
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40">
                Next<ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
