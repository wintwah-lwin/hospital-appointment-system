import React, { useEffect, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../api/client.js";
import { Link } from "react-router-dom";
import { anchorSlotLabelForAppointment } from "./appointmentUtils.js";

const FIXED_SLOTS = [
  { time: "09:00", label: "9am" },
  { time: "11:00", label: "11am" },
  { time: "14:00", label: "2pm" },
  { time: "16:00", label: "4pm" },
  { time: "17:00", label: "5pm" }
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DaySlotEditor({ days, onChange, rooms }) {
  const allRooms = rooms?.length ? rooms : ["Room-01", "Room-02", "Room-03", "Room-04", "Room-05"];
  const roomOptions = ["Room-00", ...allRooms];

  function toggleDay(dow) {
    const existing = (days || []).find(d => d.dayOfWeek === dow);
    if (existing) {
      onChange((days || []).filter(d => d.dayOfWeek !== dow));
    } else {
      onChange([...(days || []), { dayOfWeek: dow, slots: [{ time: "09:00", room: allRooms[0] }] }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    }
  }

  function updateDaySlots(dow, slots) {
    onChange((days || []).map(d => d.dayOfWeek === dow ? { ...d, slots } : d));
  }

  const WEEKDAYS = [1, 2, 3, 4, 5];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map(dow => {
          const dayConfig = (days || []).find(d => d.dayOfWeek === dow);
          const isOn = !!dayConfig;
          return (
            <button
              key={dow}
              type="button"
              onClick={() => toggleDay(dow)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition ${isOn ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
            >
              {DAY_NAMES[dow]}
            </button>
          );
        })}
      </div>
      {(days || []).map(dayConfig => (
        <div key={dayConfig.dayOfWeek} className="pl-4 border-l-2 border-zinc-200 space-y-2">
          <div className="text-sm font-medium text-zinc-700">{DAY_NAMES[dayConfig.dayOfWeek]} slots</div>
          <div className="flex flex-wrap gap-3">
            {FIXED_SLOTS.map(f => {
              const found = (dayConfig.slots || []).find(x => x.time === f.time);
              const enabled = !!found;
              const room = found?.room || allRooms[0];
              return (
                <div key={f.time} className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => {
                        const slots = dayConfig.slots || [];
                        if (e.target.checked) {
                          updateDaySlots(dayConfig.dayOfWeek, [...slots, { time: f.time, room: room === "Room-00" ? allRooms[0] : room }].sort((a, b) => a.time.localeCompare(b.time)));
                        } else {
                          updateDaySlots(dayConfig.dayOfWeek, slots.filter(s => s.time !== f.time));
                        }
                      }}
                      className="rounded border-zinc-300"
                    />
                    {f.label}
                  </label>
                  <select
                    value={room}
                    disabled={!enabled}
                    onChange={(e) => {
                      if (!enabled) return;
                      const slots = (dayConfig.slots || []).map(s => s.time === f.time ? { ...s, room: e.target.value } : s);
                      updateDaySlots(dayConfig.dayOfWeek, slots);
                    }}
                    className={`px-2 py-1.5 rounded-lg border border-zinc-200 text-sm min-w-[100px] ${!enabled ? "opacity-50 bg-zinc-50" : ""}`}
                  >
                    {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const TZ_SG = "Asia/Singapore";
const SLOT_BLOCKING = ["Booked", "Checked-In", "Waiting", "In Consultation"];

const DOCTOR_SPECIALTY_OPTIONS = ["General", "Cardiology", "Neurology", "Orthopedics"];

function RoomSlotAppointmentsLink({ room, dateYmd, doctorId, slotTime, className, children }) {
  const qs = new URLSearchParams({
    room,
    date: dateYmd,
    doctorId: String(doctorId),
    anchor: slotTime
  });
  return (
    <Link to={`/admin/appointments?${qs.toString()}`} className={className}>
      {children}
    </Link>
  );
}

function ymdForNextWeekdayFromToday(dow) {
  const now = new Date();
  const diff = (dow - now.getDay() + 7) % 7;
  const t = new Date(now);
  t.setDate(now.getDate() + diff);
  return t.toLocaleDateString("en-CA", { timeZone: TZ_SG });
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
  const [appointmentsDate, setAppointmentsDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timetableRefreshKey, setTimetableRefreshKey] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [days, setDays] = useState([]);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editDays, setEditDays] = useState([]);
  const [recordsDay, setRecordsDay] = useState(1);
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
    if (!days?.length) {
      setError("Please select at least one day with at least one time slot.");
      return;
    }
    const spec = String(specialty || "").trim();
    if (!spec) {
      setError("Please choose a specialty.");
      return;
    }
    try {
      await apiPost("/api/doctors", { name, specialty: spec, isActive: true, days });
      setName(""); setSpecialty(""); setDays([]);
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
    if (!editDays?.length) {
      setError("Please select at least one day with at least one time slot.");
      return;
    }
    const editSpec = String(editSpecialty || "").trim();
    if (!editSpec) {
      setError("Please select a specialty.");
      return;
    }
    setError("");
    try {
      await apiPatch(`/api/doctors/${editingDoctor._id}`, { name: editName, specialty: editSpec });
      await apiPatch(`/api/schedule/doctors/${editingDoctor._id}`, { days: editDays });
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
    const d = (sched.days && sched.days.length) ? sched.days : [];
    setEditingDoctor(doc);
    setEditName(doc.name);
    setEditSpecialty(doc.specialty && String(doc.specialty).trim() ? doc.specialty : "General");
    setEditDays(d);
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
          onClick={async () => { await load(); await loadSchedules(); setTimetableRefreshKey((k) => k + 1); }}
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
                <select value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white">
                  <option value="">Select specialty…</option>
                  {editSpecialty && !DOCTOR_SPECIALTY_OPTIONS.includes(editSpecialty) ? (
                    <option value={editSpecialty}>{editSpecialty} (current)</option>
                  ) : null}
                  {DOCTOR_SPECIALTY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm text-zinc-600 font-medium">Working days & slots</span>
                <div className="mt-1"><DaySlotEditor days={editDays} onChange={setEditDays} rooms={rooms} /></div>
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
          <p className="text-sm text-zinc-500 mb-4">Select which days each doctor works and assign time slots (9am, 11am, 2pm, 4pm, 5pm) with rooms per day.</p>

          <form onSubmit={addDoctor} className="space-y-4 mb-6">
            <label className="block max-w-md">
              <span className="text-sm text-zinc-600 font-medium">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" required />
            </label>
            <label className="block max-w-md">
              <span className="text-sm text-zinc-600 font-medium">Specialty</span>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} required className="mt-1 w-full px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white">
                <option value="">Select specialty…</option>
                {DOCTOR_SPECIALTY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-zinc-600 font-medium">Working days & slots</span>
              <div className="mt-1"><DaySlotEditor days={days} onChange={setDays} rooms={rooms} /></div>
            </label>
            <div className="flex gap-3 items-center">
              <button type="submit" className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition">Add</button>
            </div>
          </form>

          <div className="mb-4">
            <span className="text-sm font-medium text-zinc-600 mr-2">View by day:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {[1, 2, 3, 4, 5].map(dow => (
                <button
                  key={dow}
                  type="button"
                  onClick={() => setRecordsDay(dow)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition ${recordsDay === dow ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                >
                  {DAY_NAMES[dow]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Name</th>
                  <th className="text-left font-medium px-4 py-3">Specialty</th>
                  {FIXED_SLOTS.map(f => <th key={f.time} className="text-left font-medium px-4 py-3">{f.label}</th>)}
                  <th className="text-left font-medium px-4 py-3">Available</th>
                  <th className="text-left font-medium px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {doctors.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-zinc-500">No doctors yet.</td></tr>
                ) : (() => {
                  const recordsDateYmd = ymdForNextWeekdayFromToday(recordsDay);
                  return doctors.map(d => {
                  const sched = schedules.find(s => String(s.doctorId) === String(d._id)) || {};
                  const dayConfig = (sched.days || []).find(x => x.dayOfWeek === recordsDay);
                  const slots = dayConfig?.slots || [];
                  const isInConsultation = appointments.some(a => String(a.doctorId) === String(d._id) && a.status === "In Consultation");
                  return (
                    <tr key={d._id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{d.name}</td>
                      <td className="px-4 py-3 text-zinc-600">{d.specialty || "-"}</td>
                      {FIXED_SLOTS.map(f => {
                        const found = slots.find(x => x.time === f.time);
                        return (
                          <td key={f.time} className="px-4 py-3">
                            {found ? (
                              <RoomSlotAppointmentsLink
                                room={found.room}
                                dateYmd={recordsDateYmd}
                                doctorId={d._id}
                                slotTime={f.time}
                                className="inline-block align-middle max-w-full"
                              >
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer">
                                  {found.room}
                                </span>
                              </RoomSlotAppointmentsLink>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                        );
                      })}
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
                  );
                });
                })()}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Showing schedule for {DAY_NAMES[recordsDay]}. Use day buttons above to switch.</p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 mb-1">Doctor Timetable</h2>
          <p className="text-sm text-zinc-500 mb-4">Select a day or date to see who works. Green = both sessions free · Amber = one booked · Red = both booked (two patients per time band).</p>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <div>
              <span className="text-sm font-medium text-zinc-600 mr-2">Day:</span>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(dow => {
                  const isActive = (() => {
                    const d = new Date(timetableDate);
                    return d.getDay() === dow;
                  })();
                  const pickDateForDay = () => {
                    const d = new Date();
                    const diff = (dow - d.getDay() + 7) % 7;
                    const date = new Date(d);
                    date.setDate(d.getDate() + diff);
                    setTimetableDate(date.toISOString().slice(0, 10));
                  };
                  return (
                    <button
                      key={dow}
                      type="button"
                      onClick={pickDateForDay}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition ${isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
                    >
                      {DAY_NAMES[dow]}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-zinc-600">Or date:</span>
              <input type="date" value={timetableDate} onChange={(e) => setTimetableDate(e.target.value)} className="px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
            </label>
            <button type="button" onClick={() => setTimetableRefreshKey((k) => k + 1)} className="px-3 py-2 rounded-xl border border-zinc-200 text-sm hover:bg-zinc-50 transition">Refresh</button>
            <Link to="/admin/booking-load" className="px-3 py-2 rounded-xl border border-zinc-200 text-sm hover:bg-zinc-50 transition inline-flex items-center text-zinc-700">
              View booking load
            </Link>
            <Link to="/admin/appointments" className="px-3 py-2 rounded-xl border border-zinc-200 text-sm hover:bg-zinc-50 transition inline-flex items-center text-zinc-700">
              Appointments
            </Link>
            <Link to="/admin/room-bookings" className="px-3 py-2 rounded-xl border border-zinc-200 text-sm hover:bg-zinc-50 transition inline-flex items-center text-zinc-700">
              Room bookings
            </Link>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Doctor</th>
                  <th className="text-left font-medium px-4 py-3">Specialty</th>
                  {FIXED_SLOTS.map(f => <th key={f.time} className="text-left font-medium px-4 py-3">{f.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(() => {
                  const dayOfWeek = new Date(`${timetableDate}T12:00:00`).getDay();
                  const blockingStatuses = ["Booked", "Checked-In", "Waiting", "In Consultation"];
                  const TZ = "Asia/Singapore";
                  const dateAppointments = appointments.filter(a => {
                    const d = a.startTime ? new Date(a.startTime).toLocaleDateString("en-CA", { timeZone: TZ }) : "";
                    return d === timetableDate && blockingStatuses.includes(a.status);
                  });
                  const slotToKey = (doctorId, time) => `${doctorId}-${time}`;
                  const slotBookedCount = new Map();
                  for (const a of dateAppointments) {
                    const lab = anchorSlotLabelForAppointment(a, timetableDate);
                    const k = slotToKey(String(a.doctorId), lab);
                    slotBookedCount.set(k, (slotBookedCount.get(k) || 0) + 1);
                  }
                  const rows = doctors.map(d => {
                    const sched = schedules.find(s => String(s.doctorId) === String(d._id)) || {};
                    const dayConfig = (sched.days || []).find(x => x.dayOfWeek === dayOfWeek);
                    const slots = dayConfig?.slots || [];
                    return { doctor: d, slots };
                  }).filter(r => r.slots.length > 0);
                  if (rows.length === 0) return <tr><td colSpan={7} className="px-4 py-6 text-zinc-500">No doctors with schedule for this day. Add doctors and assign working days first.</td></tr>;
                  return rows.map(r => (
                    <tr key={r.doctor._id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{r.doctor.name}</td>
                      <td className="px-4 py-3 text-zinc-600">{r.doctor.specialty || "-"}</td>
                      {FIXED_SLOTS.map(f => {
                        const found = r.slots.find(x => x.time === f.time);
                        if (!found) return <td key={f.time} className="px-4 py-3"><span className="text-zinc-400">—</span></td>;
                        const key = slotToKey(String(r.doctor._id), found.time);
                        const cnt = slotBookedCount.get(key) || 0;
                        const loadCls =
                          cnt === 0 ? "bg-emerald-600 text-white"
                            : cnt >= 2 ? "bg-red-600 text-white"
                              : "bg-amber-500 text-white";
                        return (
                          <td key={f.time} className="px-4 py-3">
                            <RoomSlotAppointmentsLink
                              room={found.room}
                              dateYmd={timetableDate}
                              doctorId={r.doctor._id}
                              slotTime={found.time}
                              className="inline-block align-middle max-w-full"
                            >
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-90 transition cursor-pointer ${loadCls}`}>
                                {found.room}{cnt > 0 ? ` · ${cnt}/2` : ""}
                              </span>
                            </RoomSlotAppointmentsLink>
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
          <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-zinc-900">Appointments</h2>
              <label className="flex items-center gap-2">
                <span className="text-sm text-zinc-600">Date</span>
                <input
                  type="date"
                  value={appointmentsDate}
                  onChange={(e) => setAppointmentsDate(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                />
              </label>
              <span className="text-sm text-zinc-500">
                {appointments.filter(a => {
                  const d = a.startTime ? new Date(a.startTime).toISOString().slice(0, 10) : "";
                  return d === appointmentsDate;
                }).length} on this day
              </span>
            </div>
            <button onClick={async () => { if (window.confirm("Clear all appointments? This cannot be undone.")) { await apiDelete("/api/appointments/clear"); await load(); setTimetableRefreshKey((k) => k + 1); } }} className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-sm hover:bg-red-50 transition">Clear all</button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Name</th>
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
                {(() => {
                  const filtered = appointments.filter(a => {
                    const d = a.startTime ? new Date(a.startTime).toISOString().slice(0, 10) : "";
                    return d === appointmentsDate;
                  });
                  if (filtered.length === 0) return (
                    <tr><td colSpan={8} className="px-4 py-6 text-zinc-500">No appointments on this date.</td></tr>
                  );
                  return filtered.map(a => {
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
                          <button
                            onClick={async () => { if (window.confirm("Delete this appointment permanently?")) { await completeAndDelete(a._id); } }}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
                })()}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
