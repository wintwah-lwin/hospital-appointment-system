import Appointment from "../models/Appointment.js";
import Bed from "../models/Bed.js";
import Doctor from "../models/Doctor.js";

export const SLOT_MINUTES = 30; // per user request
export const SLOT_CAPACITY = 3; // max bookings per doctor session

const BLOCKING_STATUSES = ["Booked", "Checked-In", "Waiting", "In Consultation"];

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export async function isDoctorAvailable({ doctorId, startTime, endTime, ignoreAppointmentId = null }) {
  if (!doctorId) return { ok: true };

  const doc = await Doctor.findById(doctorId);
  if (!doc || doc.isActive === false) return { ok: false, reason: "Doctor not active" };

  // Note: baseSchedule/manualBlocks can be added later.
  const query = {
    doctorId,
    status: { $in: BLOCKING_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };
  if (ignoreAppointmentId) query._id = { $ne: ignoreAppointmentId };

  const bookedCount = await Appointment.countDocuments(query);
  if (bookedCount >= SLOT_CAPACITY) return { ok: false, reason: `Session full (max ${SLOT_CAPACITY})` };

  return { ok: true };
}

export async function findAvailableRoom({ startTime, endTime }) {
  // Rooms are limited: reuse Bed collection as rooms (bedId acts like roomId)
  const beds = await Bed.find({}).lean();
  if (!beds.length) return { ok: false, reason: "No rooms configured. Admin must add rooms first." };

  // Build set of occupied bedIds in the slot
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
  const max = addMinutes(now, 60 * 24 * 60); // 60 days ahead
  if (startTime < now) return { ok: false, reason: "Cannot book in the past" };
  if (startTime > max) return { ok: false, reason: "Cannot book beyond 60 days" };
  return { ok: true };
}
