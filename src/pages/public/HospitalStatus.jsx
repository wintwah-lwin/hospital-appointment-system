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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Hospital Status</h1>
        <p className="text-sm text-slate-500 mt-1">Live system overview</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-red-700">Error: {error}</div>
          <div className="mt-2 text-xs text-zinc-600">Tip: start the backend from the server folder (port 5001 by default).</div>
        </div>
      ) : !snapshot ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-600">Loading snapshot…</div>
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

        </>
      )}
    </div>
  );
}
