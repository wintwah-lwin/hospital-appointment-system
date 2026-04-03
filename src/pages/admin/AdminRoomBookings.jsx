import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../../api/client.js";

const ROOM_OPTIONS = Array.from({ length: 10 }, (_, i) => `Room-${String(i + 1).padStart(2, "0")}`);

const TZ = "Asia/Singapore";

function statusStyle(status) {
  if (status === "Cancelled") return "bg-zinc-100 text-zinc-600";
  if (status === "Completed") return "bg-emerald-50 text-emerald-800";
  if (status === "Booked") return "bg-sky-50 text-sky-800";
  if (status === "Checked-In" || status === "Waiting") return "bg-amber-50 text-amber-900";
  if (status === "In Consultation") return "bg-violet-50 text-violet-900";
  if (status === "No Show") return "bg-rose-50 text-rose-800";
  return "bg-zinc-50 text-zinc-700";
}

export default function AdminRoomBookings() {
  const [params, setParams] = useSearchParams();
  const roomFromUrl = params.get("room");
  const dateFromUrl = params.get("date");

  const [room, setRoom] = useState(() => (ROOM_OPTIONS.includes(roomFromUrl) ? roomFromUrl : "Room-01"));
  const [date, setDate] = useState(() => {
    if (dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl)) return dateFromUrl;
    return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (roomFromUrl && ROOM_OPTIONS.includes(roomFromUrl)) setRoom(roomFromUrl);
    if (dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl)) setDate(dateFromUrl);
  }, [roomFromUrl, dateFromUrl]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const q = new URLSearchParams({ room, date });
        const data = await apiGet(`/api/appointments/by-room?${q}`);
        if (!cancelled) setRows(data || []);
      } catch (e) {
        if (!cancelled) {
          setError(String(e?.message || e));
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [room, date]);

  function syncUrl(nextRoom, nextDate) {
    setParams(
      { room: nextRoom, date: nextDate },
      { replace: true }
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Bookings by room</h1>
          <p className="text-sm text-zinc-500 mt-1">Choose a room (1–10) and date to list every appointment in that room.</p>
        </div>
        <Link to="/admin" className="text-sm font-medium text-teal-600 hover:underline">← Admin overview</Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex flex-wrap gap-6 items-end">
          <label className="block">
            <span className="text-sm font-medium text-zinc-600">Room</span>
            <select
              value={room}
              onChange={(e) => {
                const r = e.target.value;
                setRoom(r);
                syncUrl(r, date);
              }}
              className="mt-1 block w-44 px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            >
              {ROOM_OPTIONS.map(r => (
                <option key={r} value={r}>{r.replace("Room-", "Room ")}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-600">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                const d = e.target.value;
                setDate(d);
                syncUrl(room, d);
              }}
              className="mt-1 block px-3 py-2 rounded-xl border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
          </label>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50 flex flex-wrap justify-between gap-2">
          <span className="text-sm font-medium text-zinc-700">
            {room} · {date}
          </span>
          <span className="text-sm text-zinc-500">
            {loading ? "Loading…" : `${rows.length} booking${rows.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-100">
              <tr>
                <th className="font-medium px-4 py-3">Time</th>
                <th className="font-medium px-4 py-3">Patient</th>
                <th className="font-medium px-4 py-3">Doctor</th>
                <th className="font-medium px-4 py-3">Specialty</th>
                <th className="font-medium px-4 py-3">Queue</th>
                <th className="font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No appointments for this room on this date.</td></tr>
              ) : rows.map(a => (
                <tr key={a._id} className="hover:bg-zinc-50/80">
                  <td className="px-4 py-3 text-zinc-800 whitespace-nowrap">
                    {a.startTime ? new Date(a.startTime).toLocaleString(undefined, { timeZone: TZ, dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{a.patientName || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.doctorNameSnapshot || "—"}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.category || "—"}</td>
                  <td className="px-4 py-3 font-mono text-zinc-700">{a.queueNumber || a.queueCategory || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
