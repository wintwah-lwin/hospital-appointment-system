import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Link } from "react-router-dom";

const SPECIALTIES = ["All doctors", "General", "Cardiology", "Neurology", "Orthopedics"];
const NEEDS_REFERRAL = ["Cardiology", "Neurology", "Orthopedics"];

export default function PatientBooking() {
  const { user } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [category, setCategory] = useState("All doctors");
  const [doctorId, setDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hasReferral, setHasReferral] = useState(false);
  const [notes, setNotes] = useState("");

  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function loadData() {
    setError("");
    try {
      const docs = await apiGet("/api/doctors");
      setDoctors(docs || []);
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  const [timetableMeta, setTimetableMeta] = useState(null);
  async function loadTimetable() {
    try {
      const data = await apiGet(`/api/schedule/timetable?date=${bookingDate}&includePastSlots=false`);
      setTimetableSlots(data.slots || []);
      setTimetableMeta({ dayName: data.dayName, date: data.date });
    } catch (e) {
      setTimetableSlots([]);
      setTimetableMeta(null);
    }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    loadTimetable();
  }, [bookingDate]);

  const filteredDoctors = useMemo(() => {
    if (category === "All doctors") return doctors || [];
    // Only doctors whose specialty exactly matches the selected category (not "General" for every specialist filter)
    return (doctors || []).filter(d => (d.specialty || "").trim() === category);
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


  const referralRequired = category !== "All doctors" && NEEDS_REFERRAL.includes(category);

  function handleConfirmClick(e) {
    e.preventDefault();
    if (referralRequired && !hasReferral) {
      setError("Referral required for specialist appointments");
      return;
    }
    if (!selectedSlot) {
      setError("Please select an available session (1st or 2nd) from the timetable");
      return;
    }
    setError("");
    setShowConfirm(true);
  }

  async function submitConfirmed() {
    if (submitting || !selectedSlot) return;
    setSubmitting(true);
    setShowConfirm(false);
    setError("");
    setCreated(null);
    try {
      const doc = doctors.find(d => String(d._id) === String(selectedSlot.doctorId));
      const cat = category === "All doctors" ? (doc?.specialty || "General") : category;
      const payload = {
        category: cat,
        doctorId: selectedSlot.doctorId,
        slotAnchorTime: selectedSlot.anchorTime,
        slotPart: selectedSlot.slotPart,
        queueCategory: "New",
        hasReferral: (cat && NEEDS_REFERRAL.includes(cat)) ? hasReferral : undefined,
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

  const doc = selectedSlot ? doctors.find(d => String(d._id) === String(selectedSlot.doctorId)) : null;
  const confirmSummary = selectedSlot && doc ? {
    doctor: doc.name,
    date: new Date(selectedSlot.startTime).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: new Date(selectedSlot.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }),
    session: selectedSlot.slotPart === 1 ? "1st session (after short wait)" : "2nd session"
  } : null;

  return (
    <div className="space-y-8 relative">
      {/* Pre-booking confirmation modal */}
      {showConfirm && confirmSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-8 text-white text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-xl font-bold">Are you sure?</h2>
              <p className="text-teal-100 text-sm mt-1">Please confirm your appointment details</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-medium text-slate-900">{confirmSummary.doctor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-900">{confirmSummary.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Consult starts</span>
                  <span className="font-medium text-slate-900">{confirmSummary.time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Session</span>
                  <span className="font-medium text-slate-900">{confirmSummary.session}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={submitConfirmed}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:opacity-50 transition shadow-lg shadow-teal-500/30"
                >
                  {submitting ? "Booking…" : "Yes, book it"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <p className="text-slate-600 text-sm">Logged in as {user?.displayName || user?.email}</p>
        </div>
        <Link to="/patient/bookings" className="text-sm font-medium text-primary-600 hover:underline shrink-0">My bookings →</Link>
      </div>

      {/* Step 1: Select specialty first, then show timetable */}
      <section>
        {timetableMeta && (
          <p className="text-sm text-slate-600 mb-2">
            Timetable for {timetableMeta.dayName}, {bookingDate ? new Date(bookingDate + "T12:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : ""}
          </p>
        )}
        <p className="text-xs text-slate-600 mb-3 max-w-3xl">
          Each time band (e.g. 9am) has two sessions: <strong>1st</strong> (short wait then consult) and <strong>2nd</strong> (after a short break). Choose a green session; grey is already booked.
        </p>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            {SPECIALTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" min={minDate} max={maxDate} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm" title="Cannot book past dates" />
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
          <div className="grid grid-cols-[minmax(100px,1fr)_repeat(5,minmax(88px,1fr))] text-sm min-w-[520px]">
            <div className="px-4 py-3 bg-slate-50 font-medium text-slate-600">Doctor</div>
            {FIXED.map(f => <div key={f.value} className="px-2 py-3 bg-slate-50 font-medium text-slate-600 text-center">{f.label}</div>)}
            {byDoctor.length === 0 ? (
              <div className="col-span-6 px-4 py-8 text-slate-500 text-sm">No timetable for this date.</div>
            ) : byDoctor.map(r => (
              <React.Fragment key={r.doctorId}>
                <div className="px-4 py-3 font-medium text-slate-900 border-t border-slate-100">{r.name}</div>
                {FIXED.map(f => {
                  const s = r.slots.find(sl => sl.slotLabel === f.value);
                  return (
                    <div key={f.value} className="px-1.5 py-2 border-t border-slate-100">
                      {s?.parts?.length ? (
                        <div className="flex flex-col gap-1">
                          {s.parts.map(p => {
                            const pick = {
                              doctorId: s.doctorId,
                              doctorName: s.doctorName,
                              anchorTime: s.anchorTime,
                              slotPart: p.part,
                              startTime: p.startTime,
                              slotLabel: s.slotLabel
                            };
                            const isSelected = selectedSlot
                              && selectedSlot.doctorId === pick.doctorId
                              && selectedSlot.anchorTime === pick.anchorTime
                              && selectedSlot.slotPart === pick.slotPart;
                            return (
                              <button
                                key={p.part}
                                type="button"
                                onClick={() => {
                                  if (!p.available) return;
                                  setSelectedSlot(pick);
                                  setDoctorId(s.doctorId);
                                }}
                                disabled={!p.available}
                                className={`w-full py-1 rounded text-[11px] font-semibold leading-tight ${p.available ? "bg-primary-600 hover:bg-primary-500 text-white" : "bg-slate-200 text-slate-500 cursor-not-allowed"} ${isSelected ? "ring-2 ring-primary-400 ring-offset-1" : ""}`}
                                title={p.available ? p.label : "Booked"}
                              >
                                {p.part === 1 ? "1st" : "2nd"}
                              </button>
                            );
                          })}
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Click <strong>1st</strong> or <strong>2nd</strong> on a teal button to select that session.</p>
      </section>

      {/* Step 2: Form */}
      <section>
        <form onSubmit={handleConfirmClick} className="space-y-4 max-w-2xl">
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
                  {FIXED.find(x => x.value === selectedSlot.slotLabel)?.label || selectedSlot.slotLabel} · {selectedSlot.slotPart === 1 ? "1st" : "2nd"} · {new Date(selectedSlot.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Singapore" })} — {doctors.find(d => String(d._id) === String(selectedSlot.doctorId))?.name || selectedSlot.doctorName}
                </span>
              ) : (
                <span className="text-slate-500 text-sm">Select a session above</span>
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
