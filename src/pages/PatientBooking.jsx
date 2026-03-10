import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { Link } from "react-router-dom";

const SPECIALTIES = ["General", "Cardiology", "Neurology", "Orthopedics"];
const NEEDS_REFERRAL = ["Cardiology", "Neurology", "Orthopedics"];

export default function PatientBooking() {
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [category, setCategory] = useState("General");
  const [doctorId, setDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hasReferral, setHasReferral] = useState(false);
  const [notes, setNotes] = useState("");

  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setError("");
    try {
      const docs = await apiGet("/api/doctors");
      setDoctors(docs || []);
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
    if (submitting) return;
    setError("");
    setCreated(null);
    setSubmitting(true);
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
        category,
        doctorId: selectedSlot.doctorId,
        startTime: selectedSlot.startTime,
        queueCategory: "New",
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
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const FIXED = [{ value: "09:00", label: "9am" }, { value: "11:00", label: "11am" }, { value: "14:00", label: "2pm" }, { value: "16:00", label: "4pm" }, { value: "17:00", label: "5pm" }];
  const byDoctor = useMemo(() => {
    const out = {};
    for (const s of filteredTimetableSlots) {
      const k = String(s.doctorId);
      if (!out[k]) out[k] = { name: s.doctorName, slots: [] };
      out[k].slots.push(s);
    }
    return Object.entries(out).map(([id, d]) => ({ doctorId: id, ...d }));
  }, [filteredTimetableSlots]);

  return (
    <div className="space-y-8 relative">
      {/* Success overlay - animated confirmation */}
      {created && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          {/* Subtle confetti dots */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-[#0d9488]"
                style={{
                  left: `${15 + (i * 7) % 70}%`,
                  top: "50%",
                  animation: `confetti-float 1.2s ease-out ${i * 0.08}s forwards`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-modal-enter relative">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#ccfbf1] flex items-center justify-center animate-success-pulse border-4 border-[#0d9488]/20">
              <svg className="w-12 h-12 text-[#0d9488]" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path className="animate-checkmark-draw" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking confirmed!</h2>
            <p className="text-slate-600 text-sm mb-7">
              {created.doctorNameSnapshot} · {new Date(created.startTime).toLocaleDateString()} at {new Date(created.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <Link
              to="/patient/bookings"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[#0d9488] text-white font-semibold hover:bg-[#0f766e] transition shadow-lg shadow-teal-600/30"
            >
              View my bookings
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="mt-4 text-sm text-slate-500 hover:text-slate-700 hover:underline transition"
            >
              Book another
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Appointment Booking</h1>
          <p className="text-slate-600 text-sm">Logged in as {user?.displayName || user?.nric || user?.email}</p>
        </div>
        <Link to="/patient/bookings" className="text-sm font-medium text-primary-600 hover:underline shrink-0">My bookings →</Link>
      </div>

      {/* Step 1: Timetable first - full width */}
      <section>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            {SPECIALTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" min={minDate} max={maxDate} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" />
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
          <div className="grid grid-cols-[minmax(100px,1fr)_repeat(5,minmax(64px,1fr))] text-sm min-w-[420px]">
            <div className="px-4 py-3 bg-slate-50 font-medium text-slate-600">Doctor</div>
            {FIXED.map(f => <div key={f.value} className="px-4 py-3 bg-slate-50 font-medium text-slate-600">{f.label}</div>)}
            {byDoctor.length === 0 ? (
              <div className="col-span-6 px-4 py-8 text-slate-500 text-sm">No timetable for this date.</div>
            ) : byDoctor.map(r => (
              <React.Fragment key={r.doctorId}>
                <div className="px-4 py-3 font-medium text-slate-900 border-t border-slate-100">{r.name}</div>
                {FIXED.map(f => {
                  const s = r.slots.find(sl => sl.slotLabel === f.value);
                  const isSelected = selectedSlot && selectedSlot.doctorId === r.doctorId && s && String(selectedSlot.startTime) === String(s.startTime);
                  return (
                    <div key={f.value} className="px-4 py-3 border-t border-slate-100">
                      {s ? (
                        <button
                          type="button"
                          onClick={() => { if (s.available) { setSelectedSlot(s); setDoctorId(s.doctorId); } }}
                          disabled={!s.available}
                          className={`block w-full py-1.5 rounded text-xs font-medium ${s.available ? "bg-primary-600 hover:bg-primary-500 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"} ${isSelected ? "ring-2 ring-primary-400 ring-offset-1" : ""}`}
                        >
                          {s.slotRoom || "-"}
                        </button>
                      ) : <span className="text-slate-300">—</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Click a teal slot to select your time.</p>
      </section>

      {/* Step 2: Form */}
      <section>
        <form onSubmit={submit} className="space-y-4 max-w-2xl">
          {referralRequired && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={hasReferral} onChange={(e) => setHasReferral(e.target.checked)} className="rounded border-slate-300 text-primary-600" />
              <span>I have a referral for this specialist</span>
            </label>
          )}
          <div className="flex flex-wrap gap-4 items-end">
            <label className="flex-1 min-w-[140px]">
              <span className="block text-xs font-medium text-slate-600 mb-1">Doctor</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">Select doctor</option>
                {filteredDoctors.map(d => <option key={d._id} value={d._id}>{d.name}{d.specialty ? ` (${d.specialty})` : ""}</option>)}
              </select>
            </label>
            <div className="min-w-[120px]">
              {selectedSlot ? (
                <span className="inline-block px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">
                  {new Date(selectedSlot.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Singapore" })} with {doctors.find(d => String(d._id) === String(selectedSlot.doctorId))?.name || selectedSlot.doctorName}
                </span>
              ) : (
                <span className="text-slate-500 text-sm">Select a slot above</span>
              )}
            </div>
          </div>
          <label>
            <span className="block text-xs font-medium text-slate-600 mb-1">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          </label>
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          <button type="submit" disabled={!selectedSlot || submitting} className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Confirm booking
          </button>
        </form>
      </section>
    </div>
  );
}
