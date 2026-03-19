import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/client.js";
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

  const activeWithToken = items.filter(a => ["Checked-In", "Waiting", "In Consultation"].includes(a.status) && a.queueNumber);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
        <Link to="/patient/book" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 text-sm">Book appointment</Link>
      </div>

      {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}

      {activeWithToken.length > 0 && (
        <div className="p-4 rounded-xl border-2 border-primary-200 bg-primary-50">
          <h3 className="font-semibold text-primary-800 mb-3">Your queue status</h3>
          <div className="space-y-3">
            {activeWithToken.map(a => (
              <div key={a._id} className="flex justify-between items-center py-2 border-b border-primary-200 last:border-0">
                <span className="text-slate-700">{a.doctorNameSnapshot} · {new Date(a.startTime).toLocaleDateString()}</span>
                <span className="font-mono text-xl font-bold text-primary-800">{a.queueNumber}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">Proceed to waiting area. Your number will be called.</p>
        </div>
      )}

      {/* Card list instead of table */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-200 bg-white text-center text-slate-500">No bookings yet.</div>
        ) : items.map(a => {
          const isCheckedIn = ["Checked-In", "Waiting", "In Consultation"].includes(a.status);
          return (
            <div
              key={a._id}
              onClick={() => navigate(`/patient/bookings/${a._id}`)}
              className={`p-4 rounded-xl border bg-white flex flex-wrap gap-4 items-center cursor-pointer hover:border-primary-300 hover:bg-slate-50/50 transition ${
                a.status === "Completed" ? "border-primary-200 bg-primary-50/30" : "border-slate-200"
              }`}
            >
              <div className="flex-1 min-w-[200px]">
                <div className="font-medium text-slate-900">{a.doctorNameSnapshot || "-"}</div>
                <div className="text-sm text-slate-600">{a.category} · {a.institutionName || "-"}</div>
                <div className="text-sm text-slate-500 mt-0.5">{new Date(a.startTime).toLocaleString()}</div>
                {isCheckedIn && a.clinicRoomNumber && <div className="text-xs text-slate-500 mt-1">Room {a.clinicRoomNumber}</div>}
              </div>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {a.queueNumber && <span className="font-mono font-medium text-slate-700">#{a.queueNumber}</span>}
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                  a.status === "Completed"
                    ? "text-primary-700 font-medium"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {a.status}
                </span>
                {a.status === "Booked" && (
                  <div className="flex gap-2">
                    {((new Date(a.startTime).getTime() - Date.now()) / (1000 * 60 * 60) >= 24) && (
                      <button onClick={() => navigate(`/patient/bookings/${a._id}/edit`)} className="px-3 py-1 rounded border border-slate-200 text-xs hover:bg-slate-50">Reschedule</button>
                    )}
                    <button onClick={() => cancel(a._id)} className="px-3 py-1 rounded border border-slate-200 text-xs text-red-600 hover:bg-red-50">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
