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

function slotToDate(dateStr, slotTime) {
  const [y, mo, day] = dateStr.split("-").map(Number);
  const { h, m } = parseSlotTime(slotTime);
  return new Date(y, (mo || 1) - 1, day || 1, h, m, 0, 0);
}

function toSlots(sched, defaultRoom = "Room-01") {
  if (sched?.slots && Array.isArray(sched.slots) && sched.slots.length > 0) {
    return sched.slots.filter(s => s?.time && s?.room?.trim());
  }
  const legacy = sched?.sections || [sched?.slot1Time, sched?.slot2Time, sched?.slot3Time].filter(Boolean);
  const rooms = ["Room-01", "Room-02", "Room-03", "Room-04", "Room-05"];
  return legacy.filter(t => FIXED_TIMES.includes(t)).map((t, i) => ({ time: t, room: sched?.room || rooms[i % 5] || defaultRoom }));
}

export async function getDoctorSchedule(doctorId) {
  let sched = await DoctorSchedule.findOne({ doctorId }).lean();
  const defaultSlots = [
    { time: "09:00", room: "Room-01" },
    { time: "11:00", room: "Room-02" },
    { time: "14:00", room: "Room-03" },
    { time: "16:00", room: "Room-04" },
    { time: "17:00", room: "Room-05" }
  ];
  if (!sched) return { slots: defaultSlots, workingDays: [1, 2, 3, 4, 5] };
  const slots = toSlots(sched);
  return { ...sched, slots: slots.length ? slots : defaultSlots, workingDays: sched.workingDays || [1, 2, 3, 4, 5] };
}

export function isSlotInSchedule(schedule, date, startTime) {
  const d = new Date(startTime);
  const dayOfWeek = d.getDay();
  const slots = toSlots(schedule);
  if (!(schedule.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek)) return false;

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
  const [y, mo, day] = dateStr.split("-").map(Number);
  const date = new Date(y, (mo || 1) - 1, day || 1);
  const dayOfWeek = date.getDay();
  const now = new Date();

  const startOfDay = new Date(y, (mo || 1) - 1, day || 1, 0, 0, 0, 0);
  const endOfDay = new Date(y, (mo || 1) - 1, day || 1, 23, 59, 59, 999);
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
    const slots = toSlots(sched);
    if (!slots.length || !(sched.workingDays || [1, 2, 3, 4, 5]).includes(dayOfWeek)) continue;

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
