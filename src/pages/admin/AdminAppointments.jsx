import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { apiGet } from "../../api/client.js";
import { TZ_SG, anchorSlotLabelForAppointment } from "./appointmentUtils.js";

function statusStyle(status) {
  if (status === "Cancelled") return "bg-zinc-100 text-zinc-600";
  if (status === "Completed") return "bg-emerald-50 text-emerald-800";
  if (status === "Booked") return "bg-sky-50 text-sky-800";
  if (status === "Checked-In" || status === "Waiting") return "bg-amber-50 text-amber-900";
  if (status === "In Consultation") return "bg-violet-50 text-violet-900";
  if (status === "No Show") return "bg-rose-50 text-rose-800";
  return "bg-zinc-50 text-zinc-700";
}

export default function AdminAppointments() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const roomQ = (searchParams.get("room") || "").trim();
  const dateQ = (searchParams.get("date") || "").trim();
  const doctorQ = (searchParams.get("doctorId") || "").trim();
  const anchorQ = (searchParams.get("anchor") || "").trim();

  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet("/api/appointments");
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(String(e?.message || e));
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (dateQ && /^\d{4}-\d{2}-\d{2}$/.test(dateQ)) {
      list = list.filter(a => {
        const d = a.startTime ? new Date(a.startTime).toLocaleDateString("en-CA", { timeZone: TZ_SG }) : "";
        return d === dateQ;
      });
    }
    if (roomQ) {
      list = list.filter(a => a.clinicRoomNumber === roomQ || a.roomIdSnapshot === roomQ);
    }
    if (doctorQ) {
      list = list.filter(a => String(a.doctorId) === doctorQ);
    }
    if (anchorQ) {
      list = list.filter(a => anchorSlotLabelForAppointment(a, dateQ || undefined) === anchorQ);
    }
    list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return list;
  }, [rows, dateQ, roomQ, doctorQ, anchorQ]);

  const filterDescription = useMemo(() => {
    const parts = [];
    if (dateQ) parts.push(`date ${dateQ}`);
    if (roomQ) parts.push(`room ${roomQ}`);
    if (doctorQ) parts.push(`doctor`);
    if (anchorQ) parts.push(`slot ${anchorQ}`);
    return parts.length ? parts.join(" · ") : "all appointments";
  }, [dateQ, roomQ, doctorQ, anchorQ]);

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Appointments</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {loading ? "Loading…" : `Showing ${filtered.length} of ${rows.length} (${filterDescription}). Open a row for full details and patient notes.`}
          </p>
        </div>
        <Link to="/admin" className="text-sm font-medium text-teal-600 hover:underline shrink-0">← Admin overview</Link>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-100">
              <tr>
                <th className="font-medium px-4 py-3">When</th>
                <th className="font-medium px-4 py-3">Patient</th>
                <th className="font-medium px-4 py-3">Doctor</th>
                <th className="font-medium px-4 py-3">Room</th>
                <th className="font-medium px-4 py-3">Band / part</th>
                <th className="font-medium px-4 py-3">Category</th>
                <th className="font-medium px-4 py-3">Status</th>
                <th className="font-medium px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-500">No appointments match these filters.</td></tr>
              ) : filtered.map(a => {
                const ymd = a.startTime ? new Date(a.startTime).toLocaleDateString("en-CA", { timeZone: TZ_SG }) : "";
                const band = anchorSlotLabelForAppointment(a, ymd);
                return (
                  <tr key={a._id} className="hover:bg-zinc-50/80">
                    <td className="px-4 py-3 text-zinc-800 whitespace-nowrap">
                      {a.startTime ? new Date(a.startTime).toLocaleString("en-SG", { timeZone: TZ_SG, dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{a.patientName || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{a.doctorNameSnapshot || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">{a.clinicRoomNumber || a.roomIdSnapshot || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {band}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{a.category || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle(a.status)}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/appointments/${a._id}`}
                        state={{ from: `${location.pathname}${location.search}` }}
                        className="text-teal-600 font-medium hover:underline text-xs sm:text-sm"
                      >
                        View details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Tip: open this page from the doctor timetable by clicking a room badge — filters are applied automatically.
      </p>
    </div>
  );
}
