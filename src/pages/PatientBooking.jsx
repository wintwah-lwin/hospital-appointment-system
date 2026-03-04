import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link } from "react-router-dom";

const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics"];
const QUEUE_CATEGORIES = ["New", "Follow-up", "Priority"];
const NEEDS_REFERRAL = ["Cardiology", "Neurology", "Orthopedics"];

export default function PatientBooking() {
  const { user } = useAuth();

  const [institutions, setInstitutions] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [institutionId, setInstitutionId] = useState("");
  const [category, setCategory] = useState("General");
  const [doctorId, setDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [queueCategory, setQueueCategory] = useState("New");
  const [hasReferral, setHasReferral] = useState(false);
  const [notes, setNotes] = useState("");

  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");

  async function loadData() {
    setError("");
    try {
      const [insts, docs] = await Promise.all([
        apiGet("/api/institutions"),
        apiGet("/api/doctors")
      ]);
      setInstitutions(insts || []);
      setDoctors(docs || []);
      if ((insts || []).length && !institutionId) setInstitutionId((insts[0]?._id || "").toString());
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  async function loadAvailableSlots() {
    if (!doctorId || !bookingDate) {
      setAvailableSlots([]);
      return;
    }
    try {
      const data = await apiGet(`/api/schedule/available?date=${bookingDate}&doctorId=${doctorId}&category=${category}`);
      setAvailableSlots(data.slots || []);
    } catch (e) {
      setAvailableSlots([]);
    }
  }

  async function loadTimetable() {
    try {
      const data = await apiGet(`/api/schedule/timetable?date=${bookingDate}`);
      setTimetableSlots(data.slots || []);
    } catch (e) {
      setTimetableSlots([]);
    }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    loadTimetable();
  }, [bookingDate]);

  useEffect(() => {
    loadAvailableSlots();
  }, [bookingDate, doctorId, category]);

  const filteredDoctors = useMemo(() => {
    return (doctors || []).filter(d => d.specialty === category || d.specialty === "General");
  }, [doctors, category]);

  const filteredTimetableSlots = useMemo(() => {
    const ids = new Set(filteredDoctors.map(d => String(d._id)));
    return timetableSlots.filter(s => ids.has(String(s.doctorId)));
  }, [timetableSlots, filteredDoctors]);

  useEffect(() => {
    if (doctorId && !filteredDoctors.some(d => d._id === doctorId)) setDoctorId("");
  }, [category, filteredDoctors, doctorId]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [doctorId, bookingDate]);

  const referralRequired = NEEDS_REFERRAL.includes(category);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setCreated(null);
    try {
      if (referralRequired && !hasReferral) {
        setError("Referral required for specialist appointments");
        return;
      }
      if (!selectedSlot) {
        setError("Please select an available time slot from the timetable");
        return;
      }

      const payload = {
        institutionId: institutionId || undefined,
        category,
        doctorId: selectedSlot.doctorId,
        startTime: selectedSlot.startTime,
        queueCategory,
        hasReferral: referralRequired ? hasReferral : undefined,
        notes
      };

      const res = await apiPost("/api/appointments", payload);
      setCreated(res);
      setNotes("");
      setSelectedSlot(null);
      setDoctorId("");
      loadTimetable();
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  const minDate = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Appointment Booking</h1>
          <p className="mt-1 text-sm text-zinc-500">Pick a date, then click a green slot in the timetable to book.</p>
        </div>
        <Link to="/patient/bookings" className="px-4 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition font-medium text-zinc-700">My bookings</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-zinc-500">Logged in as</div>
          <div className="font-medium text-zinc-900">{user?.displayName || user?.nric || user?.email}</div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-600 font-medium">Institution</span>
              <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent">
                <option value="">Select institution</option>
                {institutions.map(i => (
                  <option key={i._id} value={i._id}>{i.name}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-zinc-600 font-medium">Specialty</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent">
                {SPECIALTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            {referralRequired && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={hasReferral} onChange={(e) => setHasReferral(e.target.checked)} className="rounded" />
                <span>I have a referral for this specialist</span>
              </label>
            )}

            <label className="grid gap-2 text-sm">
              <span className="text-zinc-600 font-medium">Doctor (optional – select from timetable)</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent">
                <option value="">Select doctor</option>
                {filteredDoctors.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-zinc-600 font-medium">Date</span>
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                required
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-zinc-600 font-medium">Time slot (click a green slot in the timetable)</span>
              <div className="flex flex-wrap gap-2 items-center">
                {selectedSlot ? (
                  <span className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 text-white">
                    {new Date(selectedSlot.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })} with {doctors.find(d => String(d._id) === String(selectedSlot.doctorId))?.name || selectedSlot.doctorName}
                  </span>
                ) : (
                  <span className="text-zinc-500 text-sm">Click a green slot in the timetable below →</span>
                )}
              </div>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-zinc-600 font-medium">Queue category</span>
              <select value={queueCategory} onChange={(e) => setQueueCategory(e.target.value)} className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent">
                {QUEUE_CATEGORIES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-zinc-600 font-medium">Notes (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent" />
            </label>

            {error ? <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div> : null}

            <button type="submit" disabled={!selectedSlot} className="mt-1 rounded-xl bg-zinc-900 text-white px-4 py-2 font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition">
              Confirm booking
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Timetable</h2>
            <p className="text-sm text-zinc-500 mt-1">Click a green slot to select your time</p>
            <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Doctor</th>
                    <th className="text-left font-medium px-4 py-3">9am</th>
                    <th className="text-left font-medium px-4 py-3">11am</th>
                    <th className="text-left font-medium px-4 py-3">2pm</th>
                    <th className="text-left font-medium px-4 py-3">4pm</th>
                    <th className="text-left font-medium px-4 py-3">5pm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(() => {
                    const FIXED = [{ value: "09:00", label: "9am" }, { value: "11:00", label: "11am" }, { value: "14:00", label: "2pm" }, { value: "16:00", label: "4pm" }, { value: "17:00", label: "5pm" }];
                    const byDoctor = {};
                    for (const s of filteredTimetableSlots) {
                      const k = String(s.doctorId);
                      if (!byDoctor[k]) byDoctor[k] = { name: s.doctorName, slots: [] };
                      byDoctor[k].slots.push(s);
                    }
                    const rows = Object.entries(byDoctor).map(([id, d]) => ({ doctorId: id, ...d }));
                    if (rows.length === 0) return <tr><td colSpan={6} className="px-4 py-6 text-zinc-500">No timetable for this date. Select a weekday (Mon–Fri) or ask admin to add doctors.</td></tr>;
                    return rows.map(r => (
                      <tr key={r.doctorId} className="hover:bg-zinc-50/50">
                        <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                        {FIXED.map(f => {
                          const s = r.slots.find(sl => sl.slotLabel === f.value);
                          const isSelected = selectedSlot && selectedSlot.doctorId === r.doctorId && s && String(selectedSlot.startTime) === String(s.startTime);
                          return (
                            <td key={f.value} className="px-4 py-3">
                              {s ? (
                                <button
                                  type="button"
                                  onClick={() => { if (s.available) { setSelectedSlot(s); setDoctorId(s.doctorId); } }}
                                  disabled={!s.available}
                                  className={`px-2 py-1 rounded text-xs inline-block min-w-[3rem] font-medium ${s.available ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer" : "bg-red-600 text-white cursor-not-allowed opacity-80"} ${isSelected ? "ring-2 ring-zinc-900 ring-offset-2" : ""}`}
                                >
                                  {s.slotRoom || "-"}
                                </button>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-900">Result</h2>
            {!created ? (
              <div className="mt-3 text-sm text-zinc-500">After you submit, confirmation will appear here.</div>
            ) : (
              <div className="mt-4 grid gap-2 text-sm">
                <div><span className="text-zinc-500">Appointment ID:</span> <span className="font-mono text-zinc-900">{created.appointmentId || created._id}</span></div>
                <div><span className="text-zinc-500">Queue:</span> <span className="font-medium text-zinc-900">{created.queueCategory}</span></div>
                <div><span className="text-zinc-500">Status:</span> <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">{created.status}</span></div>
                <div><span className="text-zinc-500">Doctor:</span> {created.doctorNameSnapshot || "-"}</div>
                <div><span className="text-zinc-500">Start:</span> {new Date(created.startTime).toLocaleString()}</div>
                <div><span className="text-zinc-500">Room:</span> {created.clinicRoomNumber || "-"}</div>
                <Link to="/patient/bookings" className="mt-3 text-emerald-700 font-medium hover:underline">My bookings →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
