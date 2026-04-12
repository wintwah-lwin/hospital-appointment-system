import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../../api/client.js";
import { anchorSlotLabelForAppointment } from "./appointmentUtils.js";

const SLOT_ORDER = ["09:00", "11:00", "14:00", "16:00", "17:00"];
const SLOT_LABEL = { "09:00": "9am", "11:00": "11am", "14:00": "2pm", "16:00": "4pm", "17:00": "5pm" };
const CAPACITY_FALLBACK = 2;
const TZ = "Asia/Singapore";

function toDatePart(dateLike) {
  const d = new Date(dateLike);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

function tokenDisplay(queueNumber) {
  if (!queueNumber) return "-";
  const m = String(queueNumber).match(/(\d+)$/);
  if (!m) return queueNumber;
  return `#${String(Number(m[1]))}`;
}

export default function AdminBookingLoad() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timetable, setTimetable] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [tt, appts, docs] = await Promise.all([
        apiGet(`/api/schedule/timetable?date=${date}&includePastSlots=true`),
        apiGet("/api/appointments"),
        apiGet("/api/doctors")
      ]);
      setTimetable(tt?.slots || []);
      setAppointments(appts || []);
      setDoctors(docs || []);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, [date]);

  const doctorOptions = useMemo(() => {
    const map = new Map();
    for (const d of doctors) {
      map.set(String(d._id), d.name || "Unknown");
    }
    for (const s of timetable) {
      map.set(String(s.doctorId), s.doctorName || map.get(String(s.doctorId)) || "Unknown");
    }
    for (const a of appointments) {
      if (a.doctorId) map.set(String(a.doctorId), a.doctorNameSnapshot || map.get(String(a.doctorId)) || "Unknown");
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [timetable, appointments, doctors]);

  const rows = useMemo(() => {
    const bySlotDoctor = new Map();
    for (const s of timetable) {
      const key = `${String(s.doctorId)}|${s.slotLabel}`;
      bySlotDoctor.set(key, {
        doctorId: s.doctorId,
        doctorName: s.doctorName || "Unknown",
        time: s.slotLabel,
        totalSlots: s.capacity ?? CAPACITY_FALLBACK,
        booked: 0,
        checkedIn: 0,
        inside: 0
      });
    }
    for (const d of doctorOptions) {
      for (const t of SLOT_ORDER) {
        const key = `${d.id}|${t}`;
        if (!bySlotDoctor.has(key)) {
          bySlotDoctor.set(key, {
            doctorId: d.id,
            doctorName: d.name,
            time: t,
            totalSlots: 0,
            booked: 0,
            checkedIn: 0,
            inside: 0
          });
        }
      }
    }

    for (const a of appointments) {
      if (toDatePart(a.startTime) !== date) continue;
      if (!a.doctorId) continue;
      const slotLabel = anchorSlotLabelForAppointment(a, date);
      const key = `${String(a.doctorId)}|${slotLabel}`;
      const row = bySlotDoctor.get(key);
      if (!row) continue;
      if (["Booked", "Checked-In", "Waiting", "In Consultation"].includes(a.status)) {
        row.booked = (row.booked ?? 0) + 1;
      }
      if (a.status === "Checked-In" || a.status === "Waiting") row.checkedIn += 1;
      if (a.status === "In Consultation") row.inside += 1;
    }

    let out = Array.from(bySlotDoctor.values()).filter(r => r.totalSlots > 0 || r.booked > 0 || r.checkedIn > 0 || r.inside > 0);
    if (doctorFilter !== "all") out = out.filter(r => r.doctorId === doctorFilter);
    if (timeFilter !== "all") out = out.filter(r => r.time === timeFilter);
    out.sort((a, b) => a.doctorName.localeCompare(b.doctorName) || a.time.localeCompare(b.time));
    return out;
  }, [timetable, appointments, date, doctorOptions, doctorFilter, timeFilter]);

  const filteredBookings = useMemo(() => {
    return (appointments || [])
      .filter(a => toDatePart(a.startTime) === date)
      .filter(a => doctorFilter === "all" ? true : String(a.doctorId) === doctorFilter)
      .filter(a => timeFilter === "all" ? true : anchorSlotLabelForAppointment(a, date) === timeFilter)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [appointments, date, doctorFilter, timeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Booking Load</h1>
          <p className="text-sm text-zinc-500 mt-1">Track how many bookings are in each timetable slot.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
          <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent">
            <option value="all">All doctors</option>
            {doctorOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent">
            <option value="all">All times</option>
            {SLOT_ORDER.map(t => <option key={t} value={t}>{SLOT_LABEL[t]}</option>)}
          </select>
          <button type="button" onClick={load} className="px-4 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition text-sm font-medium">Refresh</button>
          <Link to="/admin" className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition text-sm font-medium text-zinc-700">Back</Link>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Doctor</th>
              <th className="text-left font-medium px-4 py-3">Slot</th>
              <th className="text-left font-medium px-4 py-3">Total capacity</th>
              <th className="text-left font-medium px-4 py-3">Booked</th>
              <th className="text-left font-medium px-4 py-3">Waiting (Checked-In)</th>
              <th className="text-left font-medium px-4 py-3">Inside room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-zinc-500">No slot data for the selected filters.</td></tr>
            ) : rows.map((r) => (
              <tr key={`${r.doctorId}-${r.time}`} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900">{r.doctorName}</td>
                <td className="px-4 py-3 text-zinc-600">{SLOT_LABEL[r.time] || r.time}</td>
                <td className="px-4 py-3 text-zinc-600">{r.totalSlots}</td>
                <td className="px-4 py-3 text-zinc-600">{r.booked}</td>
                <td className="px-4 py-3 text-zinc-600">{r.checkedIn}</td>
                <td className="px-4 py-3 text-zinc-600">{r.inside}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 font-semibold text-zinc-900">Bookings for selection (Doctor / Time)</div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="text-left font-medium px-4 py-3">Patient</th>
              <th className="text-left font-medium px-4 py-3">Doctor</th>
              <th className="text-left font-medium px-4 py-3">Time</th>
              <th className="text-left font-medium px-4 py-3">Room</th>
              <th className="text-left font-medium px-4 py-3">Token</th>
              <th className="text-left font-medium px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredBookings.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-zinc-500">No bookings for this selection.</td></tr>
            ) : filteredBookings.map((a) => (
              <tr key={a._id} className="hover:bg-zinc-50/50">
                <td className="px-4 py-3 font-medium text-zinc-900">{a.patientName || "-"}</td>
                <td className="px-4 py-3 text-zinc-600">{a.doctorNameSnapshot || "-"}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {new Date(a.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-3 text-zinc-600">{a.clinicRoomNumber || a.roomIdSnapshot || "-"}</td>
                <td className="px-4 py-3 font-mono font-medium">{tokenDisplay(a.queueNumber)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
