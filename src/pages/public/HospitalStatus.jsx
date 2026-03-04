import { useEffect, useMemo, useState } from "react";
import Stat from "../../components/Stat.jsx";
import Card from "../../components/Card.jsx";
import { apiGet } from "../../api/client.js";

function toneFromAlert(level) {
  if (level === "low") return { tone: "good", label: "Low load" };
  if (level === "high") return { tone: "bad", label: "High load" };
  return { tone: "warn", label: "Moderate load" };
}

export default function HospitalStatus() {
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    apiGet("/api/snapshot")
      .then((data) => alive && setSnapshot(data))
      .catch((e) => alive && setError(e.message || "Failed to load"));
    return () => {
      alive = false;
    };
  }, []);

  const alert = useMemo(() => toneFromAlert(snapshot?.alertLevel || "moderate"), [snapshot]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Hospital Status</h1>
          <p className="text-sm text-zinc-500 mt-1">Live system overview</p>
        </div>
        <div className="text-xs text-zinc-500">
          Backend: <span className="font-mono">{import.meta.env.VITE_API_BASE_URL || "http://localhost:5001"}</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-red-700">Error: {error}</div>
          <div className="mt-2 text-xs text-zinc-600">Tip: make sure backend is running and VITE_API_BASE_URL matches.</div>
        </div>
      ) : !snapshot ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-zinc-600">Loading snapshot…</div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="Total beds" value={snapshot.totalBeds} />
            <Stat label="Available beds" value={snapshot.availableBeds} />
            <Stat label="ICU available" value={snapshot.icuAvailable ?? "—"} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Stat label="ER queue" value={snapshot.erQueue} />
            <Stat label="Avg wait (mins)" value={snapshot.avgWaitMins} />
            <Stat label="Alert level" value={alert.label} tone={alert.tone} />
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-zinc-900 font-medium">Notes</div>
            <div className="mt-2 text-sm text-zinc-600">
              This dashboard pulls live data from the Node/Express API.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
