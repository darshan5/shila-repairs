"use client";

import { useEffect, useState } from "react";
import { Plus, UserX, X } from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  async function fetchUsers() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const { data } = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("User created");
      setCreateOpen(false);
      setForm({ name: "", email: "", password: "" });
      fetchUsers();
    } else {
      const { error } = await res.json();
      toast.error(error || "Failed to create user");
    }
  }

  async function handleDeactivate(userId: string, userName: string) {
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`${userName} deactivated`);
      fetchUsers();
    } else {
      const { error } = await res.json();
      toast.error(error || "Failed");
    }
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
        >
          <Plus className="h-3.5 w-3.5" />
          Add User
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : users.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
          No users yet.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className={`flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${!u.isActive ? "opacity-50" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{u.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      u.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{u.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
              {u.isActive && (
                <button
                  onClick={() => handleDeactivate(u.id, u.name)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Deactivate
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create User Panel */}
      {createOpen && (
        <>
          <div className="fixed inset-0 z-40 md:bg-transparent bg-black/20" onClick={() => setCreateOpen(false)} />
          <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 z-50 md:w-full md:max-w-md bg-white md:border-l md:shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-bold text-slate-900">Add User</h2>
              <button onClick={() => setCreateOpen(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Smith"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !form.name.trim() || !form.email.trim() || !form.password.trim()}
                className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
