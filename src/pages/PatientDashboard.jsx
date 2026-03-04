import React, { useEffect, useState } from "react";
import { apiGet } from "../api/client.js";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [timetableDate, setTimetableDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const docs = await apiGet("/api/doctors");
      setDoctors(docs);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  async function loadTimetable() {
    try {
      const data = await apiGet(`/api/schedule/timetable?date=${timetableDate}`);
      setTimetableSlots(data.slots || []);
    } catch {
      setTimetableSlots([]);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadTimetable(); }, [timetableDate]);

  const available = doctors.filter(d => d.isActive !== false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Welcome{user?.displayName ? `, ${user.displayName}` : ""}</h1>
          <p className="text-sm text-zinc-500 mt-1">Book and manage your appointments</p>
        </div>
        <div className="flex gap-3">
          <Link to="/patient/book" className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition">Book appointment</Link>
          <Link to="/patient/bookings" className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition font-medium text-zinc-700">My bookings</Link>
        </div>
      </div>

      {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{err}</div>}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">Singapore-style appointment flow</h2>
        <p className="text-sm text-zinc-500 mb-4">Book → Pre-appointment reminders (24–48h) → Arrive → Kiosk/counter check-in → Queue → Consultation → Completed.</p>
        <div className="font-semibold text-zinc-900 mb-3">Available doctors: {available.length}</div>
        <div className="overflow-x-auto rounded-xl border border-zinc-100 mb-4">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Name</th>
                <th className="text-left font-medium px-4 py-3">Specialty</th>
                <th className="text-left font-medium px-4 py-3">Room</th>
                <th className="text-left font-medium px-4 py-3">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {doctors.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-zinc-500">No doctors yet (admin must add).</td></tr>
              ) : doctors.map(d => (
                <tr key={d._id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{d.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{d.specialty || "-"}</td>
                  <td className="px-4 py-3 text-zinc-600">{d.room || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${d.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                      {d.isActive !== false ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={load} className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition text-sm font-medium">Refresh</button>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900 mb-1">Doctor Timetable</h2>
        <p className="text-sm text-zinc-500 mb-4">Green = Available · Red = Booked. Each doctor has 5 slots per day (9am, 11am, 2pm, 4pm, 5pm).</p>
        <div className="mb-4">
          <label className="text-sm text-zinc-600 mr-2">Date</label>
          <input type="date" value={timetableDate} onChange={(e) => setTimetableDate(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-100 mb-4">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="text-left font-medium px-4 py-3">Doctor</th>
                <th className="text-left font-medium px-4 py-3">Slots</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(() => {
                const byDoctor = {};
                for (const s of timetableSlots) {
                  if (!byDoctor[s.doctorId]) byDoctor[s.doctorId] = { name: s.doctorName, slots: [] };
                  byDoctor[s.doctorId].slots.push(s);
                }
                const rows = Object.entries(byDoctor).map(([id, d]) => ({ doctorId: id, ...d }));
                if (rows.length === 0) return <tr><td colSpan={2} className="px-4 py-6 text-zinc-500">No timetable for this date</td></tr>;
                return rows.map(r => (
                  <tr key={r.doctorId} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {r.slots.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).map(s => (
                          <span key={s.startTime} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.available ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                            {new Date(s.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        <Link to="/patient/book" className="inline-flex px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition">Book appointment</Link>
      </div>
    </div>
  );
}
