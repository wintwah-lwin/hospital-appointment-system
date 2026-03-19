import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

const STATUS_LIFECYCLE = "Booked → Checked-In → Waiting → In Consultation → Completed";
const STATUS_BADGE = {
  Booked: "bg-zinc-600",
  "Checked-In": "bg-blue-600",
  Waiting: "bg-amber-600",
  "In Consultation": "bg-emerald-600",
  Completed: "bg-zinc-500",
  Cancelled: "bg-red-600",
  "No Show": "bg-red-800"
};

export default function StaffDashboard() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("queue");
  const [queue, setQueue] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupErr, setLookupErr] = useState("");

  async function loadQueue() {
    setError("");
    try {
      const data = await apiGet("/api/appointments/queue/doctor");
      setQueue(data || []);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function loadAppointments() {
    setError("");
    try {
      const data = await apiGet("/api/appointments");
      setAppointments(data || []);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  useEffect(() => {
    if (tab === "queue") loadQueue();
    else loadAppointments();
  }, [tab]);

  async function handleLookup(e) {
    e.preventDefault();
    setLookupErr("");
    setLookupResult(null);
    if (!lookupEmail) {
      setLookupErr("Enter email");
      return;
    }
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE_URL || "http://localhost:5001") + "/api/appointments/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail.trim().toLowerCase() })
      });
      const text = await res.text();
      const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
      if (!res.ok) throw new Error(data.message || text || "Not found");
      setLookupResult(data);
    } catch (err) {
      setLookupErr(String(err?.message || err));
    }
  }

  async function handleCheckIn(appt) {
    try {
      await apiPost(`/api/appointments/${appt._id}/check-in`, {});
      setLookupResult(null);
      loadQueue();
      loadAppointments();
    } catch (e) {
      setLookupErr(String(e?.message || e));
    }
  }

  async function callPatient(id) {
    try {
      await apiPatch(`/api/appointments/${id}/call`, {});
      loadQueue();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function completeConsultation(id, routeTo = "Payment") {
    try {
      await apiPatch(`/api/appointments/${id}/complete`, { routeTo });
      loadQueue();
      loadAppointments();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function markNoShow(id) {
    try {
      await apiPatch(`/api/appointments/${id}/no-show`, {});
      loadQueue();
      loadAppointments();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <div className="text-sm text-zinc-500">Staff · Singapore Style</div>
          <h1 className="text-2xl font-semibold">Queue & Check-In</h1>
        </div>
        <div className="flex gap-3">
          <a href="/kiosk" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
            Kiosk mode
          </a>
          <button onClick={logout} className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
            Logout
          </button>
        </div>
      </header>

      <div className="text-xs text-zinc-500 mb-4">Status lifecycle: {STATUS_LIFECYCLE}</div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("counter")}
          className={`px-4 py-2 rounded-xl ${tab === "counter" ? "bg-zinc-700" : "bg-zinc-800/50"}`}
        >
          Counter Check-In
        </button>
        <button
          onClick={() => setTab("queue")}
          className={`px-4 py-2 rounded-xl ${tab === "queue" ? "bg-zinc-700" : "bg-zinc-800/50"}`}
        >
          Doctor Queue
        </button>
        <button
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-xl ${tab === "all" ? "bg-zinc-700" : "bg-zinc-800/50"}`}
        >
          All Appointments
        </button>
      </div>

      {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}

      {tab === "counter" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <h2 className="text-lg font-semibold mb-4">Counter Check-In</h2>
          <p className="text-sm text-zinc-500 mb-4">Search patient by email or Appointment ID, then check in.</p>
          <form onSubmit={handleLookup} className="flex gap-3 mb-4">
            <input
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="Email or Appointment ID"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2"
            />
            <button type="submit" className="rounded-xl bg-zinc-700 px-4 py-2">Search</button>
          </form>
          {lookupErr && <div className="text-red-400 text-sm mb-4">{lookupErr}</div>}
          {lookupResult && (
            <div className="rounded-xl bg-zinc-800/50 p-4 flex justify-between items-center">
              <div className="text-sm">
                <div><strong>{lookupResult.patientName}</strong> · {lookupResult.category}</div>
                <div className="text-zinc-500">{new Date(lookupResult.startTime).toLocaleString()}</div>
              </div>
              <button
                onClick={() => handleCheckIn(lookupResult)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2"
              >
                Check in
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "queue" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
          <h2 className="text-lg font-semibold mb-4">Doctor Queue</h2>
          <p className="text-sm text-zinc-500 mb-4">Queue types: New, Follow-up, Priority. Call patient to start consultation.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="py-3">Queue</th>
                  <th className="py-3">Patient</th>
                  <th className="py-3">Category</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {queue.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-zinc-500">No patients in queue.</td></tr>
                ) : queue.map(a => (
                  <tr key={a._id} className="hover:bg-zinc-900/50">
                    <td className="py-3 font-mono">{a.queueNumber || "-"}</td>
                    <td className="py-3">{a.patientName}</td>
                    <td className="py-3">{a.queueCategory} · {a.category}</td>
                    <td className="py-3">
                      <span className={`rounded px-2 py-0.5 text-xs ${STATUS_BADGE[a.status] || "bg-zinc-600"}`}>{a.status}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {(a.status === "Checked-In" || a.status === "Waiting") && (
                          <button
                            onClick={() => callPatient(a._id)}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-sm"
                          >
                            ➡ Call patient
                          </button>
                        )}
                        {a.status === "In Consultation" && (
                          <button
                            onClick={() => completeConsultation(a._id)}
                            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1 text-sm"
                          >
                            Complete
                          </button>
                        )}
                        {a.status === "Checked-In" && (
                          <button
                            onClick={() => markNoShow(a._id)}
                            className="rounded-lg border border-zinc-600 px-3 py-1 text-sm"
                          >
                            No Show
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "all" && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">All Appointments</h2>
          <table className="w-full text-sm text-left">
            <thead className="text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="py-3">When</th>
                <th className="py-3">Patient</th>
                <th className="py-3">Institution</th>
                <th className="py-3">Specialty</th>
                <th className="py-3">Queue</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {appointments.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-zinc-500">No appointments.</td></tr>
              ) : appointments.map(a => (
                <tr key={a._id}>
                  <td className="py-3">{new Date(a.startTime).toLocaleString()}</td>
                  <td className="py-3">{a.patientName}</td>
                  <td className="py-3">{a.institutionName || "-"}</td>
                  <td className="py-3">{a.category}</td>
                  <td className="py-3">{a.queueCategory}</td>
                  <td className="py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_BADGE[a.status] || "bg-zinc-600"}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
