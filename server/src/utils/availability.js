import Appointment from "../models/Appointment.js";
import Bed from "../models/Bed.js";
import Doctor from "../models/Doctor.js";

/** @deprecated legacy 30-min block; use sessionPartWindow */
export const SLOT_MINUTES = 30;

/** Two patient segments per timetable anchor (9am, 11am, …) */
export const SESSION_PARTS = 2;
export const PART1_WAIT_MIN = 5;
export const CONSULT_MIN = 25;
export const REST_BETWEEN_MIN = 5;

export const BLOCKING_STATUSES = ["Booked", "Checked-In", "Waiting", "In Consultation"];

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** anchor = timetable start e.g. 9:00. part 1 or 2 = consultation windows. */
export function sessionPartWindow(anchorDate, part) {
  const anchor = anchorDate instanceof Date ? anchorDate : new Date(anchorDate);
  const p = Number(part);
  if (p === 1) {
    const start = addMinutes(anchor, PART1_WAIT_MIN);
    const end = addMinutes(start, CONSULT_MIN);
    return { start, end };
  }
  if (p === 2) {
    const part1End = addMinutes(addMinutes(anchor, PART1_WAIT_MIN), CONSULT_MIN);
    const start = addMinutes(part1End, REST_BETWEEN_MIN);
    const end = addMinutes(start, CONSULT_MIN);
    return { start, end };
  }
  throw new Error("slotPart must be 1 or 2");
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export async function isDoctorAvailable({ doctorId, startTime, endTime, ignoreAppointmentId = null }) {
  if (!doctorId) return { ok: true };

  const doc = await Doctor.findById(doctorId);
  if (!doc || doc.isActive === false) return { ok: false, reason: "Doctor not active" };

  const query = {
    doctorId,
    status: { $in: BLOCKING_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };
  if (ignoreAppointmentId) query._id = { $ne: ignoreAppointmentId };

  const bookedCount = await Appointment.countDocuments(query);
  if (bookedCount >= 1) return { ok: false, reason: "That session segment is already booked" };

  return { ok: true };
}

export async function findAvailableRoom({ startTime, endTime }) {
  const beds = await Bed.find({}).lean();
  if (!beds.length) return { ok: false, reason: "No rooms configured. Admin must add rooms first." };

  const conflicts = await Appointment.find({
    status: { $in: BLOCKING_STATUSES },
    roomId: { $ne: null },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).select("roomId").lean();

  const occupied = new Set(conflicts.map(c => String(c.roomId)));
  const freeBed = beds.find(b => !occupied.has(String(b._id)));

  if (!freeBed) return { ok: false, reason: "No rooms available for that time" };
  return { ok: true, bed: freeBed };
}

export async function validateBookingWindow({ startTime }) {
  const now = new Date();
  const max = addMinutes(now, 60 * 24 * 60);
  if (startTime < now) return { ok: false, reason: "Cannot book in the past" };
  if (startTime > max) return { ok: false, reason: "Cannot book beyond 60 days" };
  return { ok: true };
}
