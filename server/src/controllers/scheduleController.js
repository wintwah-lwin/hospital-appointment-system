import DoctorSchedule, { FIXED_SLOTS } from "../models/DoctorSchedule.js";
import Doctor from "../models/Doctor.js";
import { getAvailableSlotsForDate, getDoctorSchedule } from "../utils/schedule.js";
import { checkDaysConflict } from "../utils/doctorConflict.js";

export const getTimetable = async (req, res) => {
  const { date, includePastSlots } = req.query;
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const includePast = includePastSlots === "true" || includePastSlots === "1";
  const slots = await getAvailableSlotsForDate(dateStr, null, null, { includePastSlots: includePast });
  const dayOfWeek = new Date(`${dateStr}T12:00:00+08:00`).getUTCDay();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  res.json({ date: dateStr, dayOfWeek, dayName: dayNames[dayOfWeek], slots, fixedSlots: FIXED_SLOTS });
};

export const getDoctorSchedules = async (req, res) => {
  const doctors = await Doctor.find({}).lean();
  const schedules = [];
  for (const d of doctors) {
    const sched = await getDoctorSchedule(d._id);
    schedules.push({ doctorId: d._id, doctorName: d.name, specialty: d.specialty, ...sched });
  }
  res.json(schedules);
};

function normalizeDays(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const times = new Set(["09:00", "11:00", "14:00", "16:00", "17:00"]);
  const out = [];
  const seenDays = new Set();
  for (const day of raw) {
    const dow = Number(day?.dayOfWeek);
    if (dow < 0 || dow > 6 || seenDays.has(dow)) continue;
    seenDays.add(dow);
    const slotList = [];
    const seenTimes = new Set();
    for (const s of day.slots || []) {
      const t = String(s?.time || "").trim();
      const r = String(s?.room || "Room-01").trim();
      if (!times.has(t) || !r || seenTimes.has(t)) continue;
      seenTimes.add(t);
      slotList.push({ time: t, room: r });
    }
    if (slotList.length > 0) out.push({ dayOfWeek: dow, slots: slotList.sort((a, b) => a.time.localeCompare(b.time)) });
  }
  return out.length ? out.sort((a, b) => a.dayOfWeek - b.dayOfWeek) : null;
}

export const updateDoctorSchedule = async (req, res) => {
  const { id } = req.params;
  const { days } = req.body || {};
  const doc = await Doctor.findById(id);
  if (!doc) return res.status(404).json({ message: "Doctor not found" });

  const normalized = normalizeDays(days);
  if (!normalized || normalized.length === 0) return res.status(400).json({ message: "At least one day with at least one slot (9am, 11am, 2pm, 4pm, 5pm) required" });
  const conflict = await checkDaysConflict(normalized, id);
  if (conflict) return res.status(409).json({ message: conflict.message });

  const sched = await DoctorSchedule.findOneAndUpdate(
    { doctorId: id },
    { $set: { doctorId: id, days: normalized } },
    { new: true, upsert: true }
  );
  res.json(sched);
};

export const getAvailableSlots = async (req, res) => {
  const { date, doctorId, category } = req.query;
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const docId = doctorId && doctorId !== "undefined" && doctorId !== "null" ? doctorId : null;
  const rows = await getAvailableSlotsForDate(dateStr, docId, category || null);
  const slots = [];
  for (const row of rows) {
    for (const p of row.parts || []) {
      if (p.available) {
        slots.push({
          doctorId: row.doctorId,
          doctorName: row.doctorName,
          specialty: row.specialty,
          slotLabel: row.slotLabel,
          slotRoom: row.slotRoom,
          anchorTime: row.anchorTime,
          slotPart: p.part,
          startTime: p.startTime,
          endTime: p.endTime,
          partLabel: p.label
        });
      }
    }
  }
  res.json({ date: dateStr, slots });
};
