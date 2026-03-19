import DoctorSchedule, { FIXED_SLOTS } from "../models/DoctorSchedule.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { SLOT_CAPACITY, SLOT_MINUTES, addMinutes } from "./availability.js";

const BLOCKING_STATUSES = ["Booked", "Checked-In", "Waiting", "In Consultation"];
const FIXED_TIMES = ["09:00", "11:00", "14:00", "16:00", "17:00"];

function parseSlotTime(s) {
  const [h, m] = (s || "09:00").split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

const TZ_OFFSET = "+08:00";
function slotToDate(dateStr, slotTime) {
  const { h, m } = parseSlotTime(slotTime);
  const hh = String(h || 0).padStart(2, "0");
  const mm = String(m || 0).padStart(2, "0");
  const iso = `${dateStr}T${hh}:${mm}:00${TZ_OFFSET}`;
  return new Date(iso);
}

/** Get slots for a specific day from schedule (days array) */
export function getSlotsForDay(sched, dayOfWeek) {
  if (!sched?.days || !Array.isArray(sched.days)) return [];
  const dayConfig = sched.days.find(d => d.dayOfWeek === dayOfWeek);
  if (!dayConfig?.slots) return [];
  return dayConfig.slots.filter(s => s?.time && s?.room?.trim());
}

export async function getDoctorSchedule(doctorId) {
  const sched = await DoctorSchedule.findOne({ doctorId }).lean();
  if (!sched || !sched.days?.length) return { days: [] };
  return { ...sched, days: sched.days };
}

export function isSlotInSchedule(schedule, date, startTime) {
  const d = new Date(startTime);
  const dayOfWeek = d.getDay();
  const slots = getSlotsForDay(schedule, dayOfWeek);
  if (!slots.length) return false;

  const dateStr = d.toISOString().slice(0, 10);
  for (const s of slots) {
    const slotStart = slotToDate(dateStr, s.time);
    const slotEnd = addMinutes(slotStart, SLOT_MINUTES);
    if (d >= slotStart && d < slotEnd) return true;
  }
  return false;
}

export async function getAvailableSlotsForDate(dateStr, doctorId = null, category = null, options = {}) {
  const { includePastSlots = false } = options;
  let doctors = doctorId
    ? await Doctor.find({ _id: doctorId }).lean()
    : await Doctor.find({}).lean();

  if (category) {
    doctors = doctors.filter(d => d.specialty === category || d.specialty === "General");
  }

  const results = [];
  const startOfDay = new Date(`${dateStr}T00:00:00${TZ_OFFSET}`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999${TZ_OFFSET}`);
  const dayOfWeek = new Date(`${dateStr}T12:00:00${TZ_OFFSET}`).getUTCDay();
  const now = new Date();
  const appointments = await Appointment.find({
    status: { $in: BLOCKING_STATUSES },
    startTime: { $gte: startOfDay },
    endTime: { $lte: endOfDay }
  }).lean();

  const bookedBy = new Map();
  for (const a of appointments) {
    const key = `${a.doctorId}-${new Date(a.startTime).getTime()}`;
    bookedBy.set(key, (bookedBy.get(key) || 0) + 1);
  }

  for (const doc of doctors) {
    const sched = await getDoctorSchedule(doc._id);
    const slots = getSlotsForDay(sched, dayOfWeek);
    if (!slots.length) continue;

    for (const s of slots) {
      const start = slotToDate(dateStr, s.time);
      const end = addMinutes(start, SLOT_MINUTES);
      if (!includePastSlots && start < now) continue;

      const key = `${doc._id}-${start.getTime()}`;
      const bookedCount = bookedBy.get(key) || 0;
      const isBooked = bookedCount >= SLOT_CAPACITY;

      results.push({
        doctorId: String(doc._id),
        doctorName: doc.name,
        specialty: doc.specialty || "General",
        startTime: start,
        endTime: end,
        slotLabel: s.time,
        slotRoom: s.room,
        available: !isBooked,
        bookedCount,
        capacity: SLOT_CAPACITY,
        remaining: Math.max(0, SLOT_CAPACITY - bookedCount)
      });
    }
  }

  results.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  return results;
}

export { FIXED_SLOTS, FIXED_TIMES };
