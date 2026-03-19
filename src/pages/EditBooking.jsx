import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../api/client.js";
import { Link, useNavigate, useParams } from "react-router-dom";

const PATIENT_CATEGORIES = ["General", "Cardiology", "Neurology", "Orthopedics"];
const SLOT_MINUTES = 30;

export default function EditBooking() {
  const { id } = useParams();
  const nav = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [appt, setAppt] = useState(null);

  const [queueCategory, setQueueCategory] = useState("New");
  const [category, setCategory] = useState("General");
  const [doctorId, setDoctorId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr("");
    try {
      const [a, d] = await Promise.all([
        apiGet(`/api/appointments/${id}`),
        apiGet("/api/doctors")
      ]);
      setAppt(a);
      setDoctors(d || []);
      setCategory(a.category);
      setQueueCategory(a.queueCategory || "New");
      setDoctorId(a.doctorId || "");
      setStartTime(new Date(a.startTime).toISOString().slice(0, 16));
      setNotes(a.notes || "");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, [id]);

  const filteredDoctors = useMemo(() => {
    return (doctors || []).filter(d => d.isActive !== false && (d.specialty === category || d.specialty === "General"));
  }, [doctors, category]);

  const canReschedule = useMemo(() => {
    if (!appt?.startTime) return true;
    const hoursUntil = (new Date(appt.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  }, [appt?.startTime]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (!PATIENT_CATEGORIES.includes(category)) throw new Error("Invalid category");
      if (!doctorId) throw new Error("Pick a doctor");
      await apiPatch(`/api/appointments/${id}`, {
        category,
        doctorId,
        startTime: new Date(startTime).toISOString(),
        queueCategory,
        notes
      });
      nav("/patient/bookings");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reschedule appointment</h1>
          <p className="text-sm text-slate-500 mt-1">Change date, time, or doctor. Slot availability will be checked.</p>
        </div>
        <Link to="/patient/bookings" className="text-sm font-medium text-[#0d9488] hover:underline shrink-0">← Back to bookings</Link>
      </div>

      {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}

      {!appt ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading…</div>
      ) : !canReschedule ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 max-w-xl">
          <p className="text-amber-800 font-medium">Rescheduling is only allowed at least 24 hours before your appointment.</p>
          <p className="text-amber-700 text-sm mt-2">Your appointment is on {new Date(appt.startTime).toLocaleString()}. Please contact the clinic if you need to change it.</p>
          <Link to="/patient/bookings" className="inline-block mt-4 text-sm font-medium text-[#0d9488] hover:underline">← Back to bookings</Link>
        </div>
      ) : (
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 max-w-xl">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent">
              {PATIENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Queue category</span>
            <select value={queueCategory} onChange={(e) => setQueueCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent">
              <option value="New">New</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Priority">Priority</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Doctor</span>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent">
              <option value="">Select doctor</option>
              {filteredDoctors.map(d => (
                <option key={d._id} value={d._id}>{d.name}{d.specialty ? ` (${d.specialty})` : ""}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Date & time</span>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min={(() => {
                const n = new Date();
                n.setMinutes(n.getMinutes() - n.getTimezoneOffset());
                return n.toISOString().slice(0, 16);
              })()}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Slot length is {SLOT_MINUTES} minutes. Cannot select past times.</p>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</span>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" placeholder="Any notes for the doctor..." />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-[#0d9488] text-white font-medium hover:bg-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed transition">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <Link to="/patient/bookings" className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition">
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
