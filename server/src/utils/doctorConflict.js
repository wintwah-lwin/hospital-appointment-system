import Doctor from "../models/Doctor.js";
import DoctorSchedule from "../models/DoctorSchedule.js";

/** Get slots for a specific day from schedule */
function getSlotsForDay(sched, dayOfWeek) {
  if (!sched?.days || !Array.isArray(sched.days)) return [];
  const dayConfig = sched.days.find(d => d.dayOfWeek === dayOfWeek);
  if (!dayConfig?.slots) return [];
  return dayConfig.slots.filter(s => s?.time && s?.room?.trim());
}

/** Check if new days config conflicts with another doctor (same room+time+day) */
export async function checkDaysConflict(days, excludeDoctorId = null) {
  if (!days?.length) return null;

  const doctors = await Doctor.find({}).lean();
  for (const doc of doctors) {
    if (excludeDoctorId && String(doc._id) === String(excludeDoctorId)) continue;
    const sched = await DoctorSchedule.findOne({ doctorId: doc._id }).lean();
    if (!sched?.days) continue;

    for (const newDay of days) {
      const theirSlots = getSlotsForDay(sched, newDay.dayOfWeek);
      const newSlotKeys = new Set((newDay.slots || []).map(s => `${s.time}|${String(s.room).trim()}`));
      for (const s of theirSlots) {
        const key = `${s.time}|${String(s.room).trim()}`;
        if (newSlotKeys.has(key)) {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const dayName = dayNames[newDay.dayOfWeek] || `Day ${newDay.dayOfWeek}`;
          const label = s.time === "09:00" ? "9am" : s.time === "11:00" ? "11am" : s.time === "14:00" ? "2pm" : s.time === "16:00" ? "4pm" : "5pm";
          return { conflict: true, message: `Room ${s.room} at ${label} on ${dayName} is already assigned to ${doc.name}. Choose a different room or time.` };
        }
      }
    }
  }
  return null;
}
