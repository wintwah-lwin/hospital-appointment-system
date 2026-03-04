import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    priority: { type: String, enum: ["normal", "high"], default: "normal" },
    activeFrom: { type: Date, default: () => new Date() },
    activeTo: { type: Date, default: null },
    createdByAdminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
