import mongoose from "mongoose";

// 5 fixed slot times
export const FIXED_SLOTS = [
  { time: "09:00", label: "9am" },
  { time: "11:00", label: "11am" },
  { time: "14:00", label: "2pm" },
  { time: "16:00", label: "4pm" },
  { time: "17:00", label: "5pm" }
];

const FIXED_TIMES = ["09:00", "11:00", "14:00", "16:00", "17:00"];

const slotSchema = new mongoose.Schema({
  time: { type: String, required: true, enum: FIXED_TIMES },
  room: { type: String, required: true, trim: true }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 1=Mon, ..., 6=Sat
  slots: {
    type: [slotSchema],
    default: [],
    validate: {
      validator(s) {
        if (!Array.isArray(s)) return false;
        const times = new Set();
        for (const slot of s) {
          if (!slot?.time || !slot?.room?.trim()) return false;
          if (!FIXED_TIMES.includes(slot.time)) return false;
          if (times.has(slot.time)) return false;
          times.add(slot.time);
        }
        return true;
      },
      message: "slots must have unique times (9am, 11am, 2pm, 4pm, 5pm) each with a room"
    }
  }
}, { _id: false });

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, unique: true },
    days: {
      type: [dayScheduleSchema],
      default: [],
      validate: {
        validator(d) {
          if (!Array.isArray(d)) return false;
          const seen = new Set();
          for (const day of d) {
            if (day?.dayOfWeek == null || day.dayOfWeek < 0 || day.dayOfWeek > 6) return false;
            if (seen.has(day.dayOfWeek)) return false;
            seen.add(day.dayOfWeek);
            if (!Array.isArray(day.slots) || day.slots.length === 0) return false;
          }
          return d.length > 0;
        },
        message: "days must have at least one day, each with at least one slot"
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model("DoctorSchedule", doctorScheduleSchema);
