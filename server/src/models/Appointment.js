import mongoose from "mongoose";

// Singapore-style status lifecycle: Booked → Checked-In → Waiting → In Consultation → Completed
// Alternates: Booked → Cancelled; Checked-In → No Show
const STATUS_ENUM = [
  "Booked",
  "Checked-In",
  "Waiting",
  "In Consultation",
  "Completed",
  "Cancelled",
  "No Show"
];

const QUEUE_CATEGORY_ENUM = ["New", "Follow-up", "Priority"];

const appointmentSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, default: "" },

    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null },
    institutionName: { type: String, default: "" },

    category: {
      type: String,
      enum: ["General", "Cardiology", "Neurology", "Orthopedics", "ICU", "Emergency"],
      required: true
    },

    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", default: null },
    doctorNameSnapshot: { type: String, default: "" },

    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Bed", default: null },
    roomIdSnapshot: { type: String, default: "" },
    clinicRoomNumber: { type: String, default: "" },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    status: {
      type: String,
      enum: STATUS_ENUM,
      default: "Booked"
    },

    queueCategory: {
      type: String,
      enum: QUEUE_CATEGORY_ENUM,
      default: "New"
    },

    queueNumber: { type: String, default: "" },
    estimatedWaitingMinutes: { type: Number, default: null },
    checkedInAt: { type: Date, default: null },
    consultationStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    referralRequired: { type: Boolean, default: false },
    hasReferral: { type: Boolean, default: false },

    bookingSource: { type: String, enum: ["online", "manual"], required: true },
    createdByRole: { type: String, enum: ["patient", "admin"], required: true },
    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    notes: { type: String, default: "" },

    reminder12hSent: { type: Boolean, default: false },
    reminder3hSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
