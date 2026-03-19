import Doctor from "../models/Doctor.js";
import DoctorSchedule from "../models/DoctorSchedule.js";
import { checkDaysConflict } from "../utils/doctorConflict.js";

export const listDoctors = async (req, res) => {
  const docs = await Doctor.find().sort({ name: 1 });
  res.json(docs);
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

export const createDoctor = async (req, res) => {
  const { name, specialty = "General", isActive = true, notes = "", days } = req.body || {};
  if (!name) return res.status(400).json({ message: "name required" });

  const dayList = normalizeDays(days);
  if (!dayList || dayList.length === 0) return res.status(400).json({ message: "At least one day with at least one slot required" });
  const conflict = await checkDaysConflict(dayList, null);
  if (conflict) return res.status(409).json({ message: conflict.message });

  const doc = await Doctor.create({ name, specialty, room: "", isActive, notes });
  await DoctorSchedule.create({ doctorId: doc._id, days: dayList });
  res.status(201).json(doc);
};

export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
  delete patch.days;
  delete patch.slots;
  const doc = await Doctor.findByIdAndUpdate(id, patch, { new: true });
  if (!doc) return res.status(404).json({ message: "Not found" });
  res.json(doc);
};

export const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  await Doctor.deleteOne({ _id: id });
  await DoctorSchedule.deleteOne({ doctorId: id });
  res.json({ ok: true });
};
