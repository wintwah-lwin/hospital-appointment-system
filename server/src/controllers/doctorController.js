import Doctor from "../models/Doctor.js";
import DoctorSchedule, { FIXED_SLOTS } from "../models/DoctorSchedule.js";
import { checkSlotsConflict } from "../utils/doctorConflict.js";

export const listDoctors = async (req, res) => {
  const docs = await Doctor.find().sort({ name: 1 });
  res.json(docs);
};

function normalizeSlots(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { time: "09:00", room: "Room-01" },
      { time: "11:00", room: "Room-02" },
      { time: "14:00", room: "Room-03" },
      { time: "16:00", room: "Room-04" },
      { time: "17:00", room: "Room-05" }
    ];
  }
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
  return out.length ? out.sort((a, b) => a.time.localeCompare(b.time)) : [
    { time: "09:00", room: "Room-01" },
    { time: "11:00", room: "Room-02" },
    { time: "14:00", room: "Room-03" },
    { time: "16:00", room: "Room-04" },
    { time: "17:00", room: "Room-05" }
  ];
}

export const createDoctor = async (req, res) => {
  const { name, specialty = "General", isActive = true, notes = "", slots } = req.body || {};
  if (!name) return res.status(400).json({ message: "name required" });

  const slotList = normalizeSlots(slots);
  const conflict = await checkSlotsConflict(slotList, null);
  if (conflict) return res.status(409).json({ message: conflict.message });

  const doc = await Doctor.create({ name, specialty, room: "", isActive, notes });
  await DoctorSchedule.findOneAndUpdate(
    { doctorId: doc._id },
    { doctorId: doc._id, slots: slotList },
    { upsert: true }
  );
  res.status(201).json(doc);
};

export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
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
