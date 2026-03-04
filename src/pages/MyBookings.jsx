import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "../api/client.js";
import { Link, useNavigate } from "react-router-dom";

export default function MyBookings() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function load() {
    setErr("");
    try {
      const data = await apiGet("/api/appointments/mine");
      setItems(data || []);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, []);

  async function cancel(id) {
    if (!confirm("Cancel this booking?")) return;
    try {
      await apiPost(`/api/appointments/${id}/cancel`, {});
      await load();
    } catch (e) {
      alert(String(e?.message || e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">My bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">View and manage your appointments</p>
        </div>
        <Link to="/patient/book" className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition">Book appointment</Link>
      </div>

      {err ? <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{err}</div> : null}

      {items.some(a => ["Checked-In", "Waiting", "In Consultation"].includes(a.status) && a.queueNumber) && (
        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50">
          <h3 className="font-semibold text-emerald-800 mb-2">Token / Queue Status</h3>
          <div className="space-y-2 text-sm">
            {items.filter(a => ["Checked-In", "Waiting", "In Consultation"].includes(a.status) && a.queueNumber).map(a => (
              <div key={a._id} className="flex items-center justify-between py-2 border-b border-emerald-200 last:border-0">
                <span className="text-zinc-600">{a.doctorNameSnapshot} · {new Date(a.startTime).toLocaleDateString()}</span>
                <span className="font-mono text-lg font-bold text-emerald-800">{a.queueNumber}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-2">Proceed to waiting area. Your number will be called.</p>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">When</th>
              <th className="text-left font-medium px-4 py-3">Institution</th>
              <th className="text-left font-medium px-4 py-3">Specialty</th>
              <th className="text-left font-medium px-4 py-3">Doctor</th>
              <th className="text-left font-medium px-4 py-3">Token</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
              <th className="text-left font-medium px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.length === 0 ? (
              <tr><td className="px-4 py-6 text-zinc-500" colSpan={7}>No bookings yet.</td></tr>
            ) : items.map(a => (
              <tr key={a._id} className={`hover:bg-zinc-50/50 ${a.status === "Completed" ? "bg-emerald-50/50" : ""}`}>
                <td className="px-4 py-3 text-zinc-600">{new Date(a.startTime).toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-600">{a.institutionName || "-"}</td>
                <td className="px-4 py-3 text-zinc-600">{a.category}</td>
                <td className="px-4 py-3 font-medium text-zinc-900">{a.doctorNameSnapshot || "-"}</td>
                <td className="px-4 py-3 font-mono font-medium text-zinc-700">{a.queueNumber || "-"}</td>
                <td className="px-4 py-3">
                  {a.status === "Completed" ? (
                    <span className="text-emerald-700 font-medium">Completed · Thank you for your visit!</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">{a.status}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {a.status === "Booked" && (
                      <>
                        <button onClick={() => navigate(`/patient/bookings/${a._id}/edit`)} className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs hover:bg-zinc-50 transition">Reschedule</button>
                        <button onClick={() => cancel(a._id)} className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs hover:bg-zinc-50 transition text-red-600 hover:bg-red-50">Cancel</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
