import React, { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../api/client.js";
import { Link } from "react-router-dom";

// 5 fixed slots: 9am, 11am, 2pm, 4pm, 5pm - each with a room
const FIXED_SLOTS = [
  { time: "09:00", label: "9am" },
  { time: "11:00", label: "11am" },
  { time: "14:00", label: "2pm" },
  { time: "16:00", label: "4pm" },
  { time: "17:00", label: "5pm" }
];

function SlotRoomSelect({ slots, onChange, rooms }) {
  const allRooms = rooms && rooms.length ? rooms : ["Room-01", "Room-02", "Room-03", "Room-04", "Room-05"];
  const roomOptions = ["Room-00", ...allRooms];
  const rows = FIXED_SLOTS.map((s) => {
    const found = (slots || []).find(x => x.time === s.time);
    return { time: s.time, enabled: !!found, room: found?.room || "Room-00" };
  });
  return (
    <div className="flex flex-col gap-2">
      {rows.map((slot) => {
        const room = slot?.room || allRooms[0];
        const time = slot?.time;
        const label = FIXED_SLOTS.find(f => f.time === time)?.label || time;
        const enabled = !!slot.enabled;
        return (
          <div key={time} className="flex items-center gap-3">
            <label className="min-w-[90px] text-sm flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    const selectedRoom = room === "Room-00" ? allRooms[0] : room;
                    const next = [...(slots || []), { time, room: selectedRoom }];
                    onChange(next.sort((a, b) => a.time.localeCompare(b.time)));
                  } else {
                    onChange((slots || []).filter(s => s.time !== time));
                  }
                }}
                className="rounded border-zinc-300"
              />
              {label}
            </label>
            <select
              value={room}
              disabled={!enabled}
              onChange={(e) => {
                if (!enabled) return;
                const next = (slots || []).map(s => s.time === time ? { ...s, room: e.target.value } : s);
                onChange(next);
              }}
              className={`px-3 py-2 rounded-xl border border-zinc-200 min-w-[120px] text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent ${!enabled ? "opacity-60 bg-zinc-50 cursor-not-allowed" : ""}`}
            >
              {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "Overdue": "bg-amber-500 text-white",
    "Inside room": "bg-emerald-600 text-white",
    "Booked": "bg-sky-100 text-sky-800",
    "Checked-In": "bg-amber-100 text-amber-800",
    "Waiting": "bg-amber-100 text-amber-800",
    "In Consultation": "bg-emerald-600 text-white",
    "Completed": "bg-zinc-100 text-zinc-700",
    "Cancelled": "bg-zinc-100 text-zinc-500",
    "No Show": "bg-zinc-100 text-zinc-500",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${map[status] || "bg-zinc-100 text-zinc-600"}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetableDate, setTimetableDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [timetableRefreshKey, setTimetableRefreshKey] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [slots, setSlots] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editSlots, setEditSlots] = useState([]);

  async function load() {
    setError("");
    try {
      const [docs, appts, beds] = await Promise.all([
        apiGet("/api/doctors"),
        apiGet("/api/appointments"),
        apiGet("/api/beds")
      ]);
      setDoctors(docs || []);
      setAppointments(appts || []);
      setRooms((beds || []).map(b => b.bedId));
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, []);

  async function loadTimetable() {
    try {
      const data = await apiGet(`/api/schedule/timetable?date=${timetableDate}`);
      setTimetableSlots(data.slots || []);
    } catch (e) {
      setTimetableSlots([]);
    }
  }

  useEffect(() => { loadTimetable(); }, [timetableDate, timetableRefreshKey]);

  async function loadSchedules() {
    try {
      const data = await apiGet("/api/schedule/doctors");
      setSchedules(data || []);
    } catch {
      setSchedules([]);
    }
  }

  useEffect(() => { loadSchedules(); }, [doctors.length]);

  async function addDoctor(e) {
    e.preventDefault();
    setError("");
    const uniqueTimes = new Set((slots || []).map(s => s.time));
    if (uniqueTimes.size < 1) {
      setError("Please select at least one time slot.");
      return;
    }
    try {
      await apiPost("/api/doctors", { name, specialty, isActive, slots });
      setName(""); setSpecialty(""); setSlots([]); setIsActive(true);
      await load();
      await loadSchedules();
      setTimetableRefreshKey((k) => k + 1);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function updateDoctor(e) {
    e.preventDefault();
    if (!editingDoctor) return;
    if (!editSlots.length) {
      setError("Please select at least one time slot.");
      return;
    }
    const uniqueTimes = new Set((editSlots || []).map(s => s.time));
    if (uniqueTimes.size < 1) {
      setError("Please select at least one time slot.");
      return;
    }
    setError("");
    try {
      await apiPatch(`/api/doctors/${editingDoctor._id}`, { name: editName, specialty: editSpecialty });
      await apiPatch(`/api/schedule/doctors/${editingDoctor._id}`, { slots: editSlots });
      setEditingDoctor(null);
      await load();
      await loadSchedules();
      setTimetableRefreshKey((k) => k + 1);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  function startEditDoctor(doc) {
    const sched = schedules.find(s => String(s.doctorId) === String(doc._id)) || {};
    const s = (sched.slots && sched.slots.length) ? sched.slots : [];
    setEditingDoctor(doc);
    setEditName(doc.name);
    setEditSpecialty(doc.specialty || "");
    setEditSlots(s || []);
    setError("");
  }

  async function removeDoctor(id) {
    try {
      await apiDelete(`/api/doctors/${id}`);
      await load();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function setApptStatus(id, status) {
    try {
      await apiPatch(`/api/appointments/${id}/status`, { status });
      await load();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function callPatient(id) {
    try {
      await apiPatch(`/api/appointments/${id}/call`, {});
      await load();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function checkInPatient(id) {
    try {
      await apiPost(`/api/appointments/${id}/check-in`, {});
      await load();
      setTimetableRefreshKey((k) => k + 1);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function completeAndDelete(id) {
    try {
      await apiDelete(`/api/appointments/${id}`);
      await load();
      setTimetableRefreshKey((k) => k + 1);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  function getDisplayStatus(a) {
    const now = new Date();
    const start = new Date(a.startTime);
    if (a.status === "Booked" && start < now) return "Overdue";
    if (a.status === "In Consultation") return "Inside room";
    return a.status;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Operations Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage doctors, schedules, and appointments.</p>
        </div>
        <button
          onClick={async () => { await load(); setTimetableRefreshKey((k) => k + 1); }}
          className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
        >
          Refresh
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {editingDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">Edit Doctor</h3>
            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
            <form onSubmit={updateDoctor} className="space-y-4">
              <label className="block">
                <span className="text-sm text-zinc-600 font-medium">Name</span>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" required />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-600 font-medium">Specialty</span>
                <input value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" placeholder="e.g., Cardiology" />
              </label>
              <label className="block">
                <span className="text-sm text-zinc-600 font-medium">5 slots (time + room)</span>
                <div className="mt-1"><SlotRoomSelect slots={editSlots} onChange={setEditSlots} rooms={rooms} /></div>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition">Save</button>
                <button type="button" onClick={() => { setEditingDoctor(null); setError(""); }} className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">Doctor Records</h2>
          <p className="text-sm text-zinc-500 mb-4">Configure 5 slots: 9am, 11am, 2pm, 4pm, 5pm — each with its own room.</p>

          <form onSubmit={addDoctor} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-6">
            <label className="block">
              <span className="text-sm text-zinc-600 font-medium">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" required />
            </label>
            <label className="block">
              <span className="text-sm text-zinc-600 font-medium">Specialty</span>
              <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" placeholder="e.g., Cardiology" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm text-zinc-600 font-medium">5 slots (time + room)</span>
              <div className="mt-1"><SlotRoomSelect slots={slots} onChange={setSlots} rooms={rooms} /></div>
            </label>
            <label className="flex gap-3 items-center">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-zinc-300" />
              <span className="text-sm text-zinc-600">Available</span>
              <button type="submit" className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition">Add</button>
            </label>
          </form>

          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Specialty</th>
                  <th className="text-left font-medium px-4 py-3">Schedule (5 slots)</th>
                  <th className="text-left font-medium px-4 py-3">Available</th>
                  <th className="text-left font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {doctors.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-zinc-500">No doctors yet.</td></tr>
                ) : doctors.map(d => {
                  const sched = schedules.find(s => String(s.doctorId) === String(d._id)) || {};
                  const existing = (sched.slots || []);
                  const dispSlots = FIXED_SLOTS.map((f) => {
                    const found = existing.find(x => x.time === f.time);
                    return found ? `${f.label}: ${found.room}` : `${f.label}: -`;
                  });
                  const isInConsultation = appointments.some(a => String(a.doctorId) === String(d._id) && a.status === "In Consultation");
                  return (
                  <tr key={d._id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{d.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{d.specialty || "-"}</td>
                    <td className="px-4 py-3 text-zinc-600 text-xs">{dispSlots.join(" · ")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isInConsultation ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {isInConsultation ? "Unavailable" : "Available"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEditDoctor(d)} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition">Edit</button>
                        <button type="button" onClick={() => removeDoctor(d._id)} className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 text-xs hover:bg-zinc-50 transition">Delete</button>
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">Doctor Timetable</h2>
          <p className="text-sm text-zinc-500 mb-4">Green = Available · Red = Booked. 5 slots: 9am, 11am, 2pm, 4pm, 5pm.</p>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-zinc-600">Date</span>
              <input type="date" value={timetableDate} onChange={(e) => setTimetableDate(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
            </label>
            <button type="button" onClick={() => setTimetableRefreshKey((k) => k + 1)} className="px-3 py-2 rounded-xl border border-zinc-200 text-sm hover:bg-zinc-50 transition">Refresh timetable</button>
            <Link to="/admin/booking-load" className="px-3 py-2 rounded-xl border border-zinc-200 text-sm hover:bg-zinc-50 transition inline-flex items-center text-zinc-700">
              View booking load
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Doctor</th>
                  <th className="text-left font-medium px-4 py-3">Specialty</th>
                  {FIXED_SLOTS.map(f => <th key={f.time} className="text-left font-medium px-4 py-3">{f.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(() => {
                  const byDoctor = {};
                  for (const s of timetableSlots) {
                    const k = String(s.doctorId);
                    if (!byDoctor[k]) byDoctor[k] = { name: s.doctorName, specialty: s.specialty || "-", slots: [] };
                    byDoctor[k].slots.push(s);
                  }
                  const rows = Object.entries(byDoctor).map(([id, d]) => {
                    const slots = d.slots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                    return { doctorId: id, doctorName: d.name, specialty: d.specialty, slots };
                  });
                  if (rows.length === 0) return <tr><td colSpan={7} className="px-4 py-6 text-zinc-500">No doctors with schedule. Add doctors first.</td></tr>;
                  return rows.map(r => (
                    <tr key={r.doctorId} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{r.doctorName}</td>
                      <td className="px-4 py-3 text-zinc-600">{r.specialty}</td>
                      {FIXED_SLOTS.map(f => {
                        const s = r.slots.find(sl => sl.slotLabel === f.time);
                        const cell = s ? { available: s.available, room: s.slotRoom } : null;
                        return (
                          <td key={f.time} className="px-4 py-3">
                            {cell !== null ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cell.available ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                                {cell.room || "-"}
                              </span>
                            ) : <span className="text-zinc-400">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">Appointments</h2>
            <button onClick={async () => { if (window.confirm("Clear all appointments? This cannot be undone.")) { await apiDelete("/api/appointments/clear"); await load(); setTimetableRefreshKey((k) => k + 1); } }} className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-sm hover:bg-red-50 transition">Clear all</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Patient</th>
                  <th className="text-left font-medium px-4 py-3">Specialty</th>
                  <th className="text-left font-medium px-4 py-3">Doctor</th>
                  <th className="text-left font-medium px-4 py-3">When</th>
                  <th className="text-left font-medium px-4 py-3">Room</th>
                  <th className="text-left font-medium px-4 py-3">Queue</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {appointments.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-zinc-500">No appointments.</td></tr>
                ) : appointments.map(a => {
                  const displayStatus = getDisplayStatus(a);
                  return (
                    <tr key={a._id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{a.patientName}</td>
                      <td className="px-4 py-3 text-zinc-600">{a.category || "-"}</td>
                      <td className="px-4 py-3 text-zinc-600">{a.doctorNameSnapshot || "-"}</td>
                      <td className="px-4 py-3 text-zinc-600">{a.startTime ? new Date(a.startTime).toLocaleString() : "-"}</td>
                      <td className="px-4 py-3 text-zinc-600">{a.clinicRoomNumber || a.roomIdSnapshot || "-"}</td>
                      <td className="px-4 py-3 font-mono text-zinc-700">{a.queueNumber ? `${a.queueNumber}${a.estimatedWaitingMinutes != null ? ` (${a.estimatedWaitingMinutes}m)` : ""}` : (a.queueCategory || "-")}</td>
                      <td className="px-4 py-3"><StatusBadge status={displayStatus} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {(a.status === "Cancelled" || a.status === "Completed" || a.status === "No Show") && (
                            <button onClick={() => setApptStatus(a._id, "Booked")} className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs hover:bg-zinc-50 transition">Set to Booked</button>
                          )}
                          {a.status === "Booked" && (
                            <>
                              <button onClick={() => checkInPatient(a._id)} className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-700 transition">Check in</button>
                              <button onClick={() => setApptStatus(a._id, "Cancelled")} className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs hover:bg-zinc-50 transition">Cancel</button>
                            </>
                          )}
                          {(a.status === "Checked-In" || a.status === "Waiting") && (
                            <button onClick={() => callPatient(a._id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition">Go inside</button>
                          )}
                          {a.status === "In Consultation" && (
                            <button onClick={() => completeAndDelete(a._id)} className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition">Complete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
