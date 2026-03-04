import mongoose from "mongoose";

// 5 fixed slots: 9am, 11am, 2pm, 4pm, 5pm - each with its own room
export const FIXED_SLOTS = [
  { time: "09:00", label: "9am" },
  { time: "11:00", label: "11am" },
  { time: "14:00", label: "2pm" },
  { time: "16:00", label: "4pm" },
  { time: "17:00", label: "5pm" }
];

const slotSchema = new mongoose.Schema({
  time: { type: String, required: true, enum: ["09:00", "11:00", "14:00", "16:00", "17:00"] },
  room: { type: String, required: true, trim: true }
}, { _id: false });

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, unique: true },
    slots: {
      type: [slotSchema],
      default: [
        { time: "09:00", room: "Room-01" },
        { time: "11:00", room: "Room-02" },
        { time: "14:00", room: "Room-03" },
        { time: "16:00", room: "Room-04" },
        { time: "17:00", room: "Room-05" }
      ],
      validate: {
        validator(s) {
          if (!Array.isArray(s) || s.length === 0) return false;
          const times = new Set();
          for (const slot of s) {
            if (!slot?.time || !slot?.room?.trim()) return false;
            if (!["09:00", "11:00", "14:00", "16:00", "17:00"].includes(slot.time)) return false;
            if (times.has(slot.time)) return false;
            times.add(slot.time);
          }
          return true;
        },
        message: "slots must have unique times (9am, 11am, 2pm, 4pm, 5pm) each with a room"
      }
    },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] } // 0=Sun, 1=Mon, ..., 6=Sat
  },
  { timestamps: true }
);

export default mongoose.model("DoctorSchedule", doctorScheduleSchema);
