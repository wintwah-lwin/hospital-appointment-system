import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (typeof uri !== "string" || !uri.trim()) {
    console.error(
      'DB error: MONGO_URI is missing. Add it to the repo root `.env` (copy from `.env.example`).'
    );
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB error:", err.message);
    process.exit(1);
  }
};
