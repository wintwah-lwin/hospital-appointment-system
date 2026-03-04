import mongoose from "mongoose";

const bedSchema = new mongoose.Schema(
  {
    bedId: { type: String, required: true, unique: true },
    ward: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ["Available", "Occupied"], default: "Available" },
  },
  { timestamps: true }
);

export default mongoose.model("Bed", bedSchema);
