"use client";

import { useEffect, useState, useRef } from "react";
import {
  ChevronDown, ChevronRight, Plus, Square, CheckSquare, GripVertical,
  Clock, X, Eye, Send,
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_GROUPS = [
  { key: "CRITICAL", label: "Critical", border: "border-l-red-500", headerBg: "bg-red-50", text: "text-red-700" },
  { key: "HIGH", label: "High", border: "border-l-orange-500", headerBg: "bg-orange-50", text: "text-orange-700" },
  { key: "MEDIUM", label: "Medium", border: "border-l-amber-500", headerBg: "bg-amber-50", text: "text-amber-700" },
  { key: "LOW", label: "Low", border: "border-l-blue-400", headerBg: "bg-blue-50", text: "text-blue-700" },
];

const PRIORITY_PILLS: Record<string, string> = {
  LOW: "bg-blue-200 text-blue-800",
  MEDIUM: "bg-amber-200 text-amber-800",
  HIGH: "bg-orange-400 text-white",
  CRITICAL: "bg-red-500 text-white",
};

type Task = {
  id: string; title: string; priority: string; status: string;
  description: string | null; dueDate: string | null; createdAt: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ completed: true });
  const [quickAdd, setQuickAdd] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Create form
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
  const [submitting, setSubmitting] = useState(false);

  // Detail panel
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [editDue, setEditDue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    const res = await fetch("/api/tasks");
    if (res.ok) { const { data } = await res.json(); setTasks(data); }
    setLoading(false);
  }

  async function handleQuickAdd(priority: string) {
    const title = quickAdd[priority]?.trim();
    if (!title) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority }),
    });
    if (res.ok) {
      setQuickAdd(q => ({ ...q, [priority]: "" }));
      toast.success("Task created");
      fetchTasks();
    }
  }

  async function handleToggle(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleComplete: true }),
    });
    fetchTasks();
    if (selectedTask?.id === id) refreshPanel(id);
  }

  async function handleInlineEdit(id: string) {
    if (!editingTitle.trim()) { setEditingId(null); return; }
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingTitle }),
    });
    setEditingId(null);
    fetchTasks();
    if (selectedTask?.id === id) refreshPanel(id);
  }

  async function handleDueDateChange(id: string, date: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: date || null }),
    });
    fetchTasks();
    if (selectedTask?.id === id) refreshPanel(id);
  }

  async function handleSaveDetail() {
    if (!selectedTask) return;
    setSaving(true);
    await fetch(`/api/tasks/${selectedTask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: editDesc || null,
        dueDate: editDue || null,
      }),
    });
    setSaving(false);
    toast.success("Saved");
    fetchTasks();
    refreshPanel(selectedTask.id);
  }

  async function refreshPanel(id: string) {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const { data } = await res.json();
      const t = data.find((x: Task) => x.id === id);
      if (t) setSelectedTask(t);
    }
  }

  function openPanel(task: Task) {
    setSelectedTask(task);
    setEditDesc(task.description || "");
    setEditDue(task.dueDate ? task.dueDate.split("T")[0] : "");
    setPanelOpen(true);
  }

  function closePanel() { setPanelOpen(false); setSelectedTask(null); }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.title.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: createForm.title,
        description: createForm.description || undefined,
        priority: createForm.priority,
        dueDate: createForm.dueDate ? new Date(createForm.dueDate).toISOString() : undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Task created");
      setCreateOpen(false);
      setCreateForm({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
      fetchTasks();
    } else {
      const { error } = await res.json();
      toast.error(error || "Failed");
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const filteredTasks = tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const grouped = PRIORITY_GROUPS.map(g => ({
    ...g,
    tasks: filteredTasks.filter(t => t.priority === g.key && t.status !== "completed"),
  }));
  const completedTasks = filteredTasks.filter(t => t.status === "completed");

  return (
    <div className="space-y-3 pb-20">
      <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>

      {/* Search + Add */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-md">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center justify-center rounded-lg border border-slate-200 p-2 hover:bg-amber-50 hover:border-amber-300 transition-colors"
          title="New Task"
        >
          <Plus className="h-5 w-5 text-amber-600" />
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-slate-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {grouped.map(group => {
            const isCollapsed = collapsed[group.key] ?? false;
            return (
              <div key={group.key} className={`rounded-lg border border-l-4 ${group.border} border-slate-200 bg-white shadow-sm`}>
                {/* Header */}
                <button
                  className={`flex w-full items-center gap-2 px-3 py-2.5 ${group.headerBg}`}
                  onClick={() => setCollapsed(c => ({ ...c, [group.key]: !isCollapsed }))}
                >
                  {isCollapsed ? <ChevronRight className={`h-4 w-4 ${group.text}`} /> : <ChevronDown className={`h-4 w-4 ${group.text}`} />}
                  <span className={`text-sm font-semibold ${group.text}`}>{group.label}</span>
                  <span className={`text-xs ${group.text} opacity-70`}>({group.tasks.length})</span>
                </button>

                {!isCollapsed && (
                  <div>
                    {/* Column header */}
                    {group.tasks.length > 0 && (
                      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <span className="w-5" /><span className="w-5" />
                        <span className="flex-1">Task</span>
                        <span className="w-20 text-center">Priority</span>
                        <span className="w-24 text-center">Due Date</span>
                        <span className="w-8" />
                      </div>
                    )}

                    {/* Task rows */}
                    {group.tasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 border-b border-slate-50 px-3 py-2 last:border-b-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <GripVertical className="h-4 w-4 text-slate-200 shrink-0 cursor-grab" />
                        <button className="shrink-0" onClick={() => handleToggle(task.id)}>
                          <Square className="h-4 w-4 text-slate-300 hover:text-amber-500 transition-colors" />
                        </button>
                        <div className="flex-1 min-w-0">
                          {editingId === task.id ? (
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onBlur={() => handleInlineEdit(task.id)}
                              onKeyDown={e => { if (e.key === "Enter") handleInlineEdit(task.id); if (e.key === "Escape") setEditingId(null); }}
                              className="w-full rounded border border-amber-300 px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          ) : (
                            <span
                              className="text-sm text-slate-800 cursor-text hover:text-amber-700 truncate block"
                              onClick={() => { setEditingId(task.id); setEditingTitle(task.title); }}
                            >
                              {task.title}
                            </span>
                          )}
                        </div>
                        <div className="w-20 flex justify-center shrink-0">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_PILLS[task.priority]}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="w-24 text-center shrink-0">
                          <input
                            type="date"
                            value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                            onChange={e => handleDueDateChange(task.id, e.target.value)}
                            className="w-full rounded border-0 bg-transparent px-0 py-0 text-xs text-slate-500 outline-none focus:text-amber-700 cursor-pointer"
                          />
                        </div>
                        <button className="shrink-0 p-1 rounded hover:bg-slate-100" onClick={() => openPanel(task)}>
                          <Eye className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      </div>
                    ))}

                    {/* Quick add */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/30">
                      <Plus className="h-4 w-4 text-slate-300 shrink-0" />
                      <input
                        value={quickAdd[group.key] || ""}
                        onChange={e => setQuickAdd(q => ({ ...q, [group.key]: e.target.value }))}
                        placeholder="Add item..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-300"
                        onKeyDown={e => { if (e.key === "Enter") handleQuickAdd(group.key); }}
                      />
                    </div>

                    {group.tasks.length === 0 && (
                      <div className="px-3 py-3 text-center text-xs text-slate-400">No tasks</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Completed */}
          {completedTasks.length > 0 && (
            <div className="rounded-lg border border-l-4 border-l-green-500 border-slate-200 bg-white shadow-sm">
              <button
                className="flex w-full items-center gap-2 px-3 py-2.5 bg-green-50"
                onClick={() => setCollapsed(c => ({ ...c, completed: !c.completed }))}
              >
                {collapsed.completed ? <ChevronRight className="h-4 w-4 text-green-700" /> : <ChevronDown className="h-4 w-4 text-green-700" />}
                <span className="text-sm font-semibold text-green-700">Completed</span>
                <span className="text-xs text-green-600">({completedTasks.length})</span>
              </button>
              {!collapsed.completed && (
                <div>
                  {completedTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-2 px-3 py-2 border-b border-slate-50 last:border-b-0 opacity-60">
                      <GripVertical className="h-4 w-4 text-slate-200 shrink-0" />
                      <button className="shrink-0" onClick={() => handleToggle(task.id)}>
                        <CheckSquare className="h-4 w-4 text-green-500" />
                      </button>
                      <span className="flex-1 text-sm text-slate-500 line-through truncate">{task.title}</span>
                      <button className="shrink-0 p-1 rounded hover:bg-slate-100" onClick={() => openPanel(task)}>
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tasks.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
              No tasks yet. Use the "+ Add item" rows above to create one.
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      {panelOpen && selectedTask && (
        <>
          <div className="fixed inset-0 z-40 md:bg-transparent bg-black/20" onClick={closePanel} />
          <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 z-50 md:w-full md:max-w-md bg-white md:border-l md:shadow-xl overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">{selectedTask.title}</h2>
                <button onClick={closePanel} className="p-1 rounded hover:bg-slate-100">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PRIORITY_PILLS[selectedTask.priority]}`}>
                  {selectedTask.priority}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${selectedTask.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {selectedTask.status}
                </span>
              </div>

              <div className="text-xs text-slate-400">Created {formatDate(selectedTask.createdAt)}</div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Add a description..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={editDue}
                  onChange={e => setEditDue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveDetail}
                  disabled={saving}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => handleToggle(selectedTask.id)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium ${selectedTask.status === "completed" ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                >
                  {selectedTask.status === "completed" ? "Reopen" : "Complete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FAB — mobile + desktop */}
      <button
        onClick={() => setCreateOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create Task Panel */}
      {createOpen && (
        <>
          <div className="fixed inset-0 z-40 md:bg-transparent bg-black/20" onClick={() => setCreateOpen(false)} />
          <div className="fixed inset-0 md:inset-y-0 md:left-auto md:right-0 z-50 md:w-full md:max-w-md bg-white md:border-l md:shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-bold text-slate-900">New Task</h2>
              <button onClick={() => setCreateOpen(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Title *</label>
                <input
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Replace HVAC filter"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Details..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={e => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={e => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || !createForm.title.trim()}
                className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
