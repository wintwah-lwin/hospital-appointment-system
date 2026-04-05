import Appointment from "../models/Appointment.js";
import { activeAppointmentWhere } from "../utils/appointmentQueries.js";
import { notifyUser } from "../utils/notify.js";

const MS_PER_HOUR = 60 * 60 * 1000;

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export async function runReminderEmails() {
  const now = Date.now();

  // 12h window: startTime between 11.5h and 12.5h from now
  const t12Start = now + 11.5 * MS_PER_HOUR;
  const t12End = now + 12.5 * MS_PER_HOUR;

  // 3h window: startTime between 2.5h and 3.5h from now
  const t3Start = now + 2.5 * MS_PER_HOUR;
  const t3End = now + 3.5 * MS_PER_HOUR;

  const appts12 = await Appointment.find(
    activeAppointmentWhere({
      status: "Booked",
      reminder12hSent: { $ne: true },
      startTime: { $gte: new Date(t12Start), $lte: new Date(t12End) }
    })
  ).lean();

  const appts3 = await Appointment.find(
    activeAppointmentWhere({
      status: "Booked",
      reminder3hSent: { $ne: true },
      startTime: { $gte: new Date(t3Start), $lte: new Date(t3End) }
    })
  ).lean();

  for (const a of appts12) {
    try {
      const when = formatDateTime(a.startTime);
      const message = `Reminder: Your appointment with ${a.doctorNameSnapshot || "your doctor"} is in 12 hours (${when}). Please arrive on time.`;
      await notifyUser({
        userId: a.patientUserId,
        role: "patient",
        type: "REMINDER_12H",
        message,
        appointmentId: a._id
      });
      await Appointment.updateOne({ _id: a._id }, { $set: { reminder12hSent: true } });
    } catch (e) {
      console.error("Reminder 12h failed for", a._id, e?.message);
    }
  }

  for (const a of appts3) {
    try {
      const when = formatDateTime(a.startTime);
      const message = `Reminder: Your appointment with ${a.doctorNameSnapshot || "your doctor"} is in 3 hours (${when}). Please arrive on time.`;
      await notifyUser({
        userId: a.patientUserId,
        role: "patient",
        type: "REMINDER_3H",
        message,
        appointmentId: a._id
      });
      await Appointment.updateOne({ _id: a._id }, { $set: { reminder3hSent: true } });
    } catch (e) {
      console.error("Reminder 3h failed for", a._id, e?.message);
    }
  }
}
