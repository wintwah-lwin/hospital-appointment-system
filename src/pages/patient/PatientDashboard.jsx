import React, { useEffect, useState } from "react";
import { apiGet } from "../../api/client.js";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";

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

  // Group timetable by doctor
  const timetableByDoctor = {};
  for (const s of timetableSlots) {
    if (!timetableByDoctor[s.doctorId]) timetableByDoctor[s.doctorId] = { name: s.doctorName, slots: [] };
    timetableByDoctor[s.doctorId].slots.push(s);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome{user?.displayName ? `, ${user.displayName}` : ""}</h1>
          <p className="text-slate-600 text-sm">Book and manage your appointments</p>
        </div>
        <div className="flex gap-2">
          <Link to="/patient/book" className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 text-sm">Book appointment</Link>
          <Link to="/patient/bookings" className="px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 text-sm">My bookings</Link>
        </div>
      </div>

      {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}

      {/* Flow as horizontal steps */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full font-medium">1. Book</span>
        <span className="text-slate-400">→</span>
        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full">2. Reminder (24–48h)</span>
        <span className="text-slate-400">→</span>
        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full">3. Check-in</span>
        <span className="text-slate-400">→</span>
        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full">4. Queue → Consult</span>
      </div>

      {/* Doctors as cards in grid */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-slate-900">Available doctors ({available.length})</h2>
          <button onClick={load} className="text-sm text-slate-600 hover:text-slate-900">Refresh</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.length === 0 ? (
            <div className="col-span-full p-6 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm">No doctors yet (admin must add).</div>
          ) : doctors.map(d => (
            <div key={d._id} className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-slate-900">{d.name}</div>
                  <div className="text-sm text-slate-600">{d.specialty || "-"}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Room {d.room || "-"}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.isActive !== false ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500"}`}>
                  {d.isActive !== false ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timetable - date picker + doctor cards with slot pills */}
      <section>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <h2 className="font-semibold text-slate-900">Doctor Timetable</h2>
          <input type="date" value={timetableDate} onChange={(e) => setTimetableDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        <div className="space-y-3">
          {Object.entries(timetableByDoctor).length === 0 ? (
            <div className="p-6 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm">No timetable for this date</div>
          ) : Object.entries(timetableByDoctor).map(([id, d]) => (
            <div key={id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center gap-3">
              <span className="font-medium text-slate-900 w-32">{d.name}</span>
              <div className="flex flex-wrap gap-2">
                {d.slots.sort((a, b) => new Date(a.anchorTime || a.startTime) - new Date(b.anchorTime || b.startTime)).map(s => (
                  <React.Fragment key={s.anchorTime || s.startTime}>
                    {(s.parts || []).map(p => (
                      <span
                        key={`${s.anchorTime}-${p.part}`}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.available ? "bg-primary-600 text-white" : "bg-slate-200 text-slate-500"}`}
                        title={p.label}
                      >
                        {s.slotLabel === "09:00" ? "9am" : s.slotLabel === "11:00" ? "11am" : s.slotLabel === "14:00" ? "2pm" : s.slotLabel === "16:00" ? "4pm" : s.slotLabel === "17:00" ? "5pm" : s.slotLabel} · {p.part === 1 ? "1st" : "2nd"}
                      </span>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Link to="/patient/book" className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 text-sm">Book appointment</Link>
      </section>
    </div>
  );
}
