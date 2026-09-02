"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

type Invoice = {
  id: string; invoiceNumber: string; status: string; total: number; createdAt: string;
  workOrder: { title: string; locationName: string | null };
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices").then(r => r.json()).then(({ data }) => { setInvoices(data || []); setLoading(false); });
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Invoices</h1>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-slate-400">
          <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
          No invoices yet. Complete a work order to create one.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
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
                <tr key={inv.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-amber-600 hover:underline">{inv.invoiceNumber}</Link>
                  </td>
                  <td className="px-3 py-2">{inv.workOrder.title}</td>
                  <td className="px-3 py-2 text-slate-500">{inv.workOrder.locationName || "—"}</td>
                  <td className="px-3 py-2 text-right font-medium">${inv.total.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === "finalized" ? "bg-green-100 text-green-700" : "bg-gray-100 text-slate-500"}`}>{inv.status}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
