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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Edit booking</h1>
        <Link to="/patient/bookings" className="rounded-xl border border-zinc-800 px-4 py-2 text-sm hover:bg-zinc-900">Back</Link>
      </div>

      <p className="mt-2 text-sm text-zinc-500">
        Reschedule your appointment. Slot availability will be checked.
      </p>

      {err ? <div className="mt-4 text-sm text-red-400">{err}</div> : null}

      {!appt ? (
        <div className="mt-6 text-sm text-zinc-500">Loading...</div>
      ) : (
        <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
          <label className="grid gap-2 text-sm">
            <span className="text-zinc-400">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
              {PATIENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-400">Queue category</span>
            <select value={queueCategory} onChange={(e) => setQueueCategory(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
              <option value="New">New</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Priority">Priority</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-400">Doctor</span>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
              <option value="">Select doctor</option>
              {filteredDoctors.map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-400">Start time</span>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2" />
            <div className="text-xs text-zinc-500">Slot length is {SLOT_MINUTES} minutes.</div>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-zinc-400">Notes</span>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2" />
          </label>

          <button disabled={saving} className="rounded-xl bg-white/10 px-4 py-2 font-medium hover:bg-white/15 disabled:opacity-60">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}
    </div>
  );
}
