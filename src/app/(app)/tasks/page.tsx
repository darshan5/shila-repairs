"use client";

import { useEffect, useState } from "react";
import { Plus, CheckSquare, Square } from "lucide-react";

type Task = { id: string; title: string; priority: string; status: string; dueDate: string | null; createdAt: string };

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-100 text-blue-700",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-200 text-orange-800",
  CRITICAL: "bg-red-200 text-red-800",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    const res = await fetch("/api/tasks");
    if (res.ok) { const { data } = await res.json(); setTasks(data); }
    setLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, priority: newPriority }),
    });
    setNewTitle("");
    fetchTasks();
  }

  async function handleToggle(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleComplete: true }),
    });
    fetchTasks();
  }

  const openTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>

      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2.5 text-sm outline-none focus:border-amber-500">
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <button onClick={handleCreate} disabled={!newTitle.trim()} className="rounded-lg bg-amber-500 px-3 py-2.5 text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-50">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-2">
          {openTasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-amber-200">
              <button onClick={() => handleToggle(task.id)}>
                <Square className="h-5 w-5 text-slate-300 transition-colors hover:text-amber-500" />
              </button>
              <span className="flex-1 text-sm text-slate-900">{task.title}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
              {task.dueDate && <span className="text-xs text-slate-400">{new Date(task.dueDate).toLocaleDateString()}</span>}
            </div>
          ))}

          {completedTasks.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Completed ({completedTasks.length})</p>
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 opacity-60">
                  <button onClick={() => handleToggle(task.id)}>
                    <CheckSquare className="h-5 w-5 text-emerald-500" />
                  </button>
                  <span className="flex-1 text-sm text-slate-500 line-through">{task.title}</span>
                </div>
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-400 shadow-sm">No tasks yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
