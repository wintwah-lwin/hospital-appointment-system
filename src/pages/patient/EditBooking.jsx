import React, { useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch } from "../../api/client.js";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isWeekendYmdSG } from "../../utils/clinicHours.js";

const PATIENT_CATEGORIES = ["General", "Cardiology", "Neurology", "Orthopedics"];
const TZ = "Asia/Singapore";

const SLOT_LABEL_PRETTY = {
  "09:00": "9am",
  "11:00": "11am",
  "14:00": "2pm",
  "16:00": "4pm",
  "17:00": "5pm"
};

function formatSlotChoiceLine(s) {
  const timeStr = s.startTime
    ? new Date(s.startTime).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    : "";
  if (s.legacy) return `${s.partLabel || "Legacy"} — ${timeStr}`;
  const band = s.slotLabel ? (SLOT_LABEL_PRETTY[s.slotLabel] || s.slotLabel) : "";
  return band ? `${band} — ${timeStr}` : `Consult ${timeStr}`;
}

function sgDateYmd(iso) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}

function slotChoiceKey(s) {
  if (s.legacy) return `legacy:${s.startTime}`;
  return `${s.anchorTime}|${s.slotPart}`;
}

export default function EditBooking() {
  const { id } = useParams();
  const nav = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [appt, setAppt] = useState(null);

  const [queueCategory, setQueueCategory] = useState("New");
  const [category, setCategory] = useState("General");
  const [doctorId, setDoctorId] = useState("");
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotChoices, setSlotChoices] = useState([]);
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
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
      setBookingDate(sgDateYmd(a.startTime));
      setNotes(a.notes || "");
      if (a.slotAnchorTime && (a.slotPart === 1 || a.slotPart === 2)) {
        setSelectedSlotKey(`${new Date(a.slotAnchorTime).toISOString()}|${a.slotPart}`);
      } else {
        setSelectedSlotKey(`legacy:${new Date(a.startTime).toISOString()}`);
      }
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    let cancelled = false;
    async function loadSlots() {
      if (!appt || !doctorId || !bookingDate || !PATIENT_CATEGORIES.includes(category)) {
        if (!cancelled) setSlotChoices([]);
        return;
      }
      try {
        const data = await apiGet(`/api/schedule/available?date=${bookingDate}&doctorId=${doctorId}&category=${encodeURIComponent(category)}`);
        if (cancelled) return;
        let list = [...(data.slots || [])];
        const curIso = appt.slotAnchorTime ? new Date(appt.slotAnchorTime).toISOString() : null;
        const curPart = appt.slotPart;
        const inList = curIso && (curPart === 1 || curPart === 2) && list.some(s => s.anchorTime === curIso && Number(s.slotPart) === Number(curPart));
        if (curIso && (curPart === 1 || curPart === 2) && !inList && appt.status === "Booked") {
          const anchorHH = new Date(appt.slotAnchorTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
          list.unshift({
            anchorTime: curIso,
            slotPart: Number(curPart),
            startTime: new Date(appt.startTime).toISOString(),
            partLabel: `Current booking (${anchorHH})`,
            slotLabel: anchorHH,
            doctorId: String(appt.doctorId),
            doctorName: appt.doctorNameSnapshot
          });
        }
        if (!appt.slotAnchorTime && appt.status === "Booked") {
          list.unshift({
            legacy: true,
            startTime: new Date(appt.startTime).toISOString(),
            partLabel: `Keep current start (${new Date(appt.startTime).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })})`,
            doctorId: String(appt.doctorId)
          });
        }
        setSlotChoices(list);
      } catch {
        if (!cancelled) setSlotChoices([]);
      }
    }
    loadSlots();
    return () => { cancelled = true; };
  }, [appt, bookingDate, doctorId, category]);

  useEffect(() => {
    if (!selectedSlotKey || !slotChoices.length) return;
    if (!slotChoices.some(s => slotChoiceKey(s) === selectedSlotKey)) setSelectedSlotKey("");
  }, [slotChoices, selectedSlotKey]);

  const filteredDoctors = useMemo(() => {
    return (doctors || []).filter(d => d.isActive !== false && (d.specialty || "").trim() === category);
  }, [doctors, category]);

  const canReschedule = useMemo(() => {
    if (!appt?.startTime) return true;
    const hoursUntil = (new Date(appt.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  }, [appt?.startTime]);

  const bookingDateIsWeekend = isWeekendYmdSG(bookingDate);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (bookingDateIsWeekend) throw new Error("The clinic is closed on weekends. Please choose Monday–Friday.");
      if (!PATIENT_CATEGORIES.includes(category)) throw new Error("Invalid category");
      if (!doctorId) throw new Error("Pick a doctor");
      const sel = slotChoices.find(s => slotChoiceKey(s) === selectedSlotKey);
      if (!sel) throw new Error("Choose a time slot");

      const body = {
        category,
        doctorId,
        queueCategory,
        notes
      };
      if (sel.legacy) {
        body.startTime = sel.startTime;
      } else {
        body.slotAnchorTime = sel.anchorTime;
        body.slotPart = sel.slotPart;
      }

      await apiPatch(`/api/appointments/${id}`, body);
      nav("/patient/bookings");
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }

  const minDate = new Date().toLocaleDateString("en-CA", { timeZone: TZ });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reschedule appointment</h1>
          <p className="text-sm text-slate-500 mt-1">Pick a doctor, date, and time. Availability is checked when you save.</p>
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
            <span className="block text-sm font-medium text-slate-700 mb-1">Date</span>
            <input
              type="date"
              min={minDate}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            />
            {bookingDateIsWeekend && (
              <p className="text-sm text-amber-800 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                The clinic is closed on weekends. Choose a weekday to reschedule.
              </p>
            )}
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Time slot</span>
            <select
              value={selectedSlotKey}
              onChange={(e) => setSelectedSlotKey(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
            >
              <option value="">Select time</option>
              {slotChoices.map(s => (
                <option key={slotChoiceKey(s)} value={slotChoiceKey(s)}>{formatSlotChoiceLine(s)}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</span>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" placeholder="Any notes for the doctor..." />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || !selectedSlotKey || bookingDateIsWeekend} className="px-6 py-2.5 rounded-lg bg-[#0d9488] text-white font-medium hover:bg-[#0f766e] disabled:opacity-50 disabled:cursor-not-allowed transition">
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
