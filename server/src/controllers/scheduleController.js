import DoctorSchedule, { FIXED_SLOTS } from "../models/DoctorSchedule.js";
import Doctor from "../models/Doctor.js";
import { getAvailableSlotsForDate, getDoctorSchedule } from "../utils/schedule.js";
import { checkSlotsConflict } from "../utils/doctorConflict.js";

export const getTimetable = async (req, res) => {
  const { date } = req.query;
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const slots = await getAvailableSlotsForDate(dateStr, null, null, { includePastSlots: true });
  res.json({ date: dateStr, slots, fixedSlots: FIXED_SLOTS });
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

function normalizeSlots(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const times = new Set(["09:00", "11:00", "14:00", "16:00", "17:00"]);
  const seen = new Set();
  const out = [];
  for (const s of raw) {
    const t = String(s?.time || "").trim();
    const r = String(s?.room || "Room-01").trim();
    if (!times.has(t) || !r) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push({ time: t, room: r });
  }
  return out.length ? out.sort((a, b) => a.time.localeCompare(b.time)) : null;
}

export const updateDoctorSchedule = async (req, res) => {
  const { id } = req.params;
  const { slots, workingDays } = req.body || {};
  const doc = await Doctor.findById(id);
  if (!doc) return res.status(404).json({ message: "Doctor not found" });

  const update = { doctorId: id };
  if (slots != null) {
    const normalized = normalizeSlots(slots);
    if (!normalized || normalized.length === 0) return res.status(400).json({ message: "At least one slot (9am, 11am, 2pm, 4pm, 5pm) with room required" });
    const conflict = await checkSlotsConflict(normalized, id);
    if (conflict) return res.status(409).json({ message: conflict.message });
    update.slots = normalized;
  }
  if (workingDays != null) update.workingDays = Array.isArray(workingDays) ? workingDays : [1, 2, 3, 4, 5];

  const sched = await DoctorSchedule.findOneAndUpdate(
    { doctorId: id },
    { $set: update },
    { new: true, upsert: true }
  );
  res.json(sched);
};

export const getAvailableSlots = async (req, res) => {
  const { date, doctorId, category } = req.query;
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const docId = doctorId && doctorId !== "undefined" && doctorId !== "null" ? doctorId : null;
  const slots = await getAvailableSlotsForDate(dateStr, docId, category || null);
  res.json({ date: dateStr, slots: slots.filter(s => s.available) });
};
