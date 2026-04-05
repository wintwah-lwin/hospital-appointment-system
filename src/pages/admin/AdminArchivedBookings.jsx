import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api/client.js";

export default function AdminArchivedBookings() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        const data = await apiGet("/api/appointments/archived/history");
        setItems(data || []);
      } catch (e) {
        setErr(String(e?.message || e));
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Archived bookings</h1>
        <p className="text-slate-600 text-sm mt-1">
          Appointments removed from the main admin list are kept here for audit. Open a row to view full detail.
        </p>
      </div>

      {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Removed</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Doctor</th>
              <th className="px-4 py-3 font-medium">Start</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No archived appointments.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a._id} className="text-slate-800">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {a.deletedAt ? new Date(a.deletedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">{a.patientName || "—"}</td>
                  <td className="px-4 py-3">{a.doctorNameSnapshot || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.startTime ? new Date(a.startTime).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/appointments/${a._id}`} className="text-[#0d9488] font-medium hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
