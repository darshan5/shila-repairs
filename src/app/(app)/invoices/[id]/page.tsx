"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Printer, Lock } from "lucide-react";

type LineItem = { id: string; description: string; quantity: number; unitPrice: number; total: number; category: string };
type InvoiceDetail = {
  id: string; invoiceNumber: string; status: string;
  vendorName: string | null; vendorAddress: string | null;
  customerName: string | null; customerAddress: string | null;
  subtotal: number; tax: number; total: number; notes: string | null;
  createdAt: string; lineItems: LineItem[];
  workOrder: { title: string; locationName: string | null; equipmentName: string | null; description: string | null };
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [inv, setInv] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingInfo, setEditingInfo] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [tax, setTax] = useState("");
  const [notes, setNotes] = useState("");

  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("labor");

  useEffect(() => { fetchInvoice(); }, [id]);

  async function fetchInvoice() {
    setLoading(true);
    const res = await fetch(`/api/invoices/${id}`);
    if (res.ok) {
      const { data } = await res.json();
      setInv(data);
      setVendorName(data.vendorName || "");
      setVendorAddress(data.vendorAddress || "");
      setCustomerName(data.customerName || "");
      setCustomerAddress(data.customerAddress || "");
      setTax(String(data.tax || 0));
      setNotes(data.notes || "");
    }
    setLoading(false);
  }

  async function handleSaveInfo() {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorName, vendorAddress, customerName, customerAddress, tax: parseFloat(tax) || 0, notes }),
    });
    setEditingInfo(false);
    fetchInvoice();
  }

  async function handleAddItem() {
    if (!newDesc.trim() || !newPrice) return;
    await fetch(`/api/invoices/${id}/line-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: newDesc, quantity: parseFloat(newQty), unitPrice: parseFloat(newPrice), category: newCategory }),
    });
    setNewDesc(""); setNewQty("1"); setNewPrice(""); setNewCategory("labor");
    fetchInvoice();
  }

  async function handleRemoveItem(itemId: string) {
    await fetch(`/api/invoices/${id}/line-items?itemId=${itemId}`, { method: "DELETE" });
    fetchInvoice();
  }

  async function handleFinalize() {
    if (!confirm("Finalize this invoice? It cannot be edited afterwards.")) return;
    await fetch(`/api/invoices/${id}/finalize`, { method: "POST" });
    fetchInvoice();
  }

  if (loading || !inv) return <p className="py-8 text-center text-slate-400">Loading...</p>;

  const isDraft = inv.status === "draft";
  const categoryColors: Record<string, string> = { labor: "bg-blue-100 text-blue-700", parts: "bg-green-100 text-green-700", materials: "bg-amber-100 text-amber-700" };

  return (
    <div className="max-w-3xl space-y-6 print:max-w-none print:space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/invoices")} className="rounded p-1 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-xl font-bold">Invoice #{inv.invoiceNumber}</h1>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isDraft ? "bg-gray-100" : "bg-green-100 text-green-700"}`}>{inv.status}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50">
            <Printer className="h-3.5 w-3.5" />Print
          </button>
          {isDraft && (
            <button onClick={handleFinalize} className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
              <Lock className="h-3.5 w-3.5" />Finalize
            </button>
          )}
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">Invoice #{inv.invoiceNumber}</h1>
        <p className="text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
      </div>

      {/* Vendor / Customer */}
      <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase">From</p>
          {editingInfo ? (
            <div className="mt-1 space-y-1">
              <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="Vendor name" className="w-full rounded border px-2 py-1 text-sm" />
              <input value={vendorAddress} onChange={(e) => setVendorAddress(e.target.value)} placeholder="Vendor address" className="w-full rounded border px-2 py-1 text-sm" />
            </div>
          ) : (
            <div className="mt-1 text-sm">
              <p className="font-medium">{inv.vendorName || "Not set"}</p>
              {inv.vendorAddress && <p className="text-slate-400">{inv.vendorAddress}</p>}
            </div>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase">To</p>
          {editingInfo ? (
            <div className="mt-1 space-y-1">
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="w-full rounded border px-2 py-1 text-sm" />
              <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Customer address" className="w-full rounded border px-2 py-1 text-sm" />
            </div>
          ) : (
            <div className="mt-1 text-sm">
              <p className="font-medium">{inv.customerName || inv.workOrder.locationName || "Not set"}</p>
              {inv.customerAddress && <p className="text-slate-400">{inv.customerAddress}</p>}
            </div>
          )}
        </div>
        {isDraft && (
          <div className="col-span-2 print:hidden">
            {editingInfo ? (
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-slate-400">Tax</label>
                  <input type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-slate-400">Notes</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded border px-2 py-1 text-sm" />
                </div>
                <button onClick={handleSaveInfo} className="self-end rounded bg-amber-500 px-3 py-1 text-sm text-white">Save</button>
                <button onClick={() => setEditingInfo(false)} className="self-end rounded border px-3 py-1 text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setEditingInfo(true)} className="text-xs text-amber-600 hover:underline">Edit info</button>
            )}
          </div>
        )}
      </div>

      {/* Work Order ref */}
      <p className="text-sm text-slate-400">Work Order: {inv.workOrder.title}</p>

      {/* Line Items */}
      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Description</th>
              <th className="px-3 py-2 text-center font-medium">Category</th>
              <th className="px-3 py-2 text-right font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Unit Price</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              {isDraft && <th className="px-3 py-2 w-10 print:hidden" />}
            </tr>
          </thead>
          <tbody>
            {inv.lineItems.map(item => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{item.description}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${categoryColors[item.category] || "bg-gray-100"}`}>{item.category}</span>
                </td>
                <td className="px-3 py-2 text-right">{item.quantity}</td>
                <td className="px-3 py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-medium">${item.total.toFixed(2)}</td>
                {isDraft && (
                  <td className="px-3 py-2 print:hidden">
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add item */}
        {isDraft && (
          <div className="flex gap-2 border-t p-3 print:hidden">
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" className="flex-1 rounded border px-2 py-1 text-sm" />
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="rounded border px-2 py-1 text-sm">
              <option value="labor">Labor</option>
              <option value="parts">Parts</option>
              <option value="materials">Materials</option>
            </select>
            <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} className="w-16 rounded border px-2 py-1 text-sm text-right" />
            <input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Price" className="w-24 rounded border px-2 py-1 text-sm text-right" />
            <button onClick={handleAddItem} disabled={!newDesc.trim() || !newPrice} className="rounded bg-amber-500 p-1.5 text-white disabled:opacity-50">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span>${inv.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-slate-400">Tax</span><span>${inv.tax.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-1 font-bold text-base"><span>Total</span><span>${inv.total.toFixed(2)}</span></div>
        </div>
      </div>

      {inv.notes && <p className="text-sm text-slate-400">Notes: {inv.notes}</p>}
    </div>
  );
}
