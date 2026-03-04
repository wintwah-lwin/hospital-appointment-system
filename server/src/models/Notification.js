import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "staff", "patient"], required: true },
    type: { type: String, enum: ["BOOKED", "APPROVED", "REJECTED", "EDITED", "CANCELLED", "DELETED"], required: true },
    message: { type: String, required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
