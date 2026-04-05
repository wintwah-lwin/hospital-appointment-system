import DoctorSchedule, { FIXED_SLOTS } from "../models/DoctorSchedule.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import { activeAppointmentWhere } from "./appointmentQueries.js";
import { BLOCKING_STATUSES, sessionPartWindow, PART1_WAIT_MIN, CONSULT_MIN, REST_BETWEEN_MIN, SESSION_PARTS } from "./availability.js";

const FIXED_TIMES = ["09:00", "11:00", "14:00", "16:00", "17:00"];

const TZ_OFFSET = "+08:00";

function parseSlotTime(s) {
  const [h, m] = (s || "09:00").split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export function slotToDate(dateStr, slotTime) {
  const { h, m } = parseSlotTime(slotTime);
  const hh = String(h || 0).padStart(2, "0");
  const mm = String(m || 0).padStart(2, "0");
  const iso = `${dateStr}T${hh}:${mm}:00${TZ_OFFSET}`;
  return new Date(iso);
}

/** HH:mm in Singapore for anchor instant */
export function anchorTimeLabelSG(anchorTime) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(new Date(anchorTime));
  const hour = (parts.find(p => p.type === "hour")?.value || "00").padStart(2, "0");
  const minute = (parts.find(p => p.type === "minute")?.value || "00").padStart(2, "0");
  return `${hour}:${minute}`;
}

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

/** Whether anchor (e.g. 9:00) exists in this doctor's schedule that day */
export function isAnchorInSchedule(schedule, anchorTime) {
  const anchor = new Date(anchorTime);
  const dayOfWeek = anchor.getDay();
  const slots = getSlotsForDay(schedule, dayOfWeek);
  const want = anchorTimeLabelSG(anchor);
  return slots.some(s => String(s.time) === want);
}

/** Legacy: start falls inside any part window of a configured slot (for old appointments). */
export function isSlotInSchedule(schedule, _date, startTime) {
  const d = new Date(startTime);
  const dayOfWeek = d.getDay();
  const slots = getSlotsForDay(schedule, dayOfWeek);
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .formatToParts(d)
    .reduce((acc, p) => {
      if (p.type === "year") acc.y = p.value;
      if (p.type === "month") acc.m = p.value;
      if (p.type === "day") acc.d = p.value;
      return acc;
    }, {});
  const ds = `${dateStr.y}-${dateStr.m}-${dateStr.d}`;
  if (!slots.length) return false;
  for (const s of slots) {
    const anchor = slotToDate(ds, s.time);
    for (const part of [1, 2]) {
      const { start, end } = sessionPartWindow(anchor, part);
      if (d >= start && d < end) return true;
    }
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

  const appointments = await Appointment.find(
    activeAppointmentWhere({
      status: { $in: BLOCKING_STATUSES },
      startTime: { $lt: endOfDay },
      endTime: { $gt: startOfDay }
    })
  ).lean();

  function segmentBooked(partStart, partEnd, docId) {
    return appointments.some(a =>
      String(a.doctorId) === String(docId) &&
      new Date(a.startTime) < partEnd &&
      new Date(a.endTime) > partStart
    );
  }

  for (const doc of doctors) {
    const sched = await getDoctorSchedule(doc._id);
    const slots = getSlotsForDay(sched, dayOfWeek);
    if (!slots.length) continue;

    for (const s of slots) {
      const anchor = slotToDate(dateStr, s.time);
      const partsOut = [];
      let anyFuture = false;
      for (const part of [1, 2]) {
        const { start, end } = sessionPartWindow(anchor, part);
        if (!includePastSlots && end <= now) continue;
        anyFuture = true;
        const booked = segmentBooked(start, end, doc._id);
        partsOut.push({
          part,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          available: !booked,
          label:
            part === 1
              ? `1st (${PART1_WAIT_MIN}m wait + ${CONSULT_MIN}m)`
              : `2nd (+${REST_BETWEEN_MIN}m break + ${CONSULT_MIN}m)`
        });
      }
      if (!anyFuture) continue;
      results.push({
        doctorId: String(doc._id),
        doctorName: doc.name,
        specialty: doc.specialty || "General",
        slotLabel: s.time,
        slotRoom: s.room,
        anchorTime: anchor.toISOString(),
        capacity: SESSION_PARTS,
        parts: partsOut
      });
    }
  }

  results.sort((a, b) => new Date(a.anchorTime) - new Date(b.anchorTime));
  return results;
}

/** For admin UI: match appointment to timetable column (09:00 …) */
export function slotLabelForAppointment(appt, dateStr) {
  if (appt.slotAnchorTime) {
    return anchorTimeLabelSG(appt.slotAnchorTime);
  }
  const t = new Date(appt.startTime);
  for (const ft of FIXED_TIMES) {
    const anchor = slotToDate(dateStr, ft);
    for (const part of [1, 2]) {
      const { start, end } = sessionPartWindow(anchor, part);
      if (t >= start && t < end) return ft;
    }
  }
  return anchorTimeLabelSG(t);
}

export { FIXED_SLOTS, FIXED_TIMES };
