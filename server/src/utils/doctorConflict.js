import Doctor from "../models/Doctor.js";
import DoctorSchedule from "../models/DoctorSchedule.js";

async function toSlots(sched) {
  if (sched?.slots && Array.isArray(sched.slots) && sched.slots.length > 0) {
    return sched.slots.filter(s => s?.time && s?.room?.trim());
  }
  const legacy = sched?.sections || [sched?.slot1Time, sched?.slot2Time, sched?.slot3Time].filter(Boolean);
  const doc = sched?.doctorId ? await Doctor.findById(sched.doctorId).select("room").lean() : null;
  const room = doc?.room?.trim() || "Room-01";
  return legacy.filter(t => ["09:00", "11:00", "14:00", "16:00", "17:00"].includes(t)).map(t => ({ time: t, room }));
}

/** Check if slots (time+room pairs) conflict with another doctor */
export async function checkSlotsConflict(slots, excludeDoctorId = null) {
  if (!slots?.length) return null;
  const slotKeys = new Set(slots.map(s => `${s.time}|${String(s.room).trim()}`));

  const doctors = await Doctor.find({}).lean();
  for (const doc of doctors) {
    if (excludeDoctorId && String(doc._id) === String(excludeDoctorId)) continue;
    const sched = await DoctorSchedule.findOne({ doctorId: doc._id }).lean();
    const theirSlots = await toSlots({ ...sched, doctorId: doc._id });
    for (const s of theirSlots) {
      const key = `${s.time}|${String(s.room).trim()}`;
      if (slotKeys.has(key)) {
        const label = s.time === "09:00" ? "9am" : s.time === "11:00" ? "11am" : s.time === "14:00" ? "2pm" : s.time === "16:00" ? "4pm" : "5pm";
        return { conflict: true, message: `Room ${s.room} at ${label} is already assigned to ${doc.name}. Please choose a different room or time.` };
      }
    }
  }
  return null;
}
