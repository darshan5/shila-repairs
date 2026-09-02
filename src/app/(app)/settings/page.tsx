"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [url, setUrl] = useState("https://walkthefloor.com");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(({ data }) => {
      setUrl(data.walkTheFloorUrl || "https://walkthefloor.com");
      setHasApiKey(data.hasApiKey);
      setLastSync(data.lastSyncAt);
      setLastError(data.lastSyncError);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const body: any = { walkTheFloorUrl: url };
    if (apiKey.trim()) body.walkTheFloorApiKey = apiKey;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const { data } = await res.json();
      setHasApiKey(data.hasApiKey);
      setApiKey("");
      alert("Settings saved");
    }
  }

  async function handleSync() {
    setSyncing(true);
    const res = await fetch("/api/sync", { method: "POST" });
    setSyncing(false);
    if (res.ok) {
      const { data } = await res.json();
      alert(`Synced: ${data.synced} work orders`);
      setLastSync(new Date().toISOString());
      setLastError(null);
    } else {
      const { error } = await res.json();
      setLastError(error);
      alert(error);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-lg border p-4 space-y-4">
        <h2 className="text-lg font-semibold">WalkTheFloor Connection</h2>

        <div>
          <label className="text-sm font-medium">API URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium">API Key</label>
          {hasApiKey && !apiKey && <p className="text-xs text-green-600 mb-1">API key configured</p>}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasApiKey ? "Enter new key to replace..." : "Enter API key (wtf_live_...)"}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Sync Status</h2>
        <div className="text-sm">
          <p className="text-gray-600">{hasApiKey ? "API key configured" : "No API key configured"}</p>
          {lastSync && <p className="text-gray-500">Last sync: {new Date(lastSync).toLocaleString()}</p>}
          {lastError && <p className="text-red-600">Last error: {lastError}</p>}
        </div>
        <button
          onClick={handleSync}
          disabled={syncing || !hasApiKey}
          className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>
    </div>
  );
}
