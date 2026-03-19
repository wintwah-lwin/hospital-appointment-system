/**
 * Migration: Remove NRIC and Department data from database.
 * Run: node scripts/migrate-remove-nric.js
 * Requires: MONGO_URI in env or .env
 */
import "dotenv/config";
import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/intellicare";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  // 1. Remove nric/dob from users; delete users without email (cannot log in with email-only auth)
  try {
    const r = await db.collection("users").updateMany({}, { $unset: { nric: "", dob: "" } });
    console.log("Users: removed nric and dob from", r.modifiedCount, "documents");
    const del = await db.collection("users").deleteMany({ $or: [{ email: null }, { email: "" }] });
    if (del.deletedCount > 0) console.log("Users: deleted", del.deletedCount, "users without email");
  } catch (e) {
    console.warn("Users update:", e.message);
  }

  // 2. Remove patientNric from appointments; set patientEmail from User if possible
  try {
    const appts = await db.collection("appointments").find({}).toArray();
    const users = await db.collection("users").find({}).project({ _id: 1, email: 1 }).toArray();
    const userEmailMap = Object.fromEntries(users.map((u) => [String(u._id), (u.email || "").toLowerCase()]));
    let updated = 0;
    for (const a of appts) {
      const email = userEmailMap[String(a.patientUserId)] || "";
      await db.collection("appointments").updateOne(
        { _id: a._id },
        { $unset: { patientNric: "" }, $set: { patientEmail: email } }
      );
      updated++;
    }
    console.log("Appointments: removed patientNric, set patientEmail for", updated, "documents");
  } catch (e) {
    console.warn("Appointments update:", e.message);
  }

  // 3. Drop Department collection
  try {
    const cols = await db.listCollections().toArray();
    if (cols.some((c) => c.name === "departments")) {
      await db.collection("departments").drop();
      console.log("Dropped departments collection");
    } else {
      console.log("Departments collection not found (already removed)");
    }
  } catch (e) {
    console.warn("Departments drop:", e.message);
  }

  // 4. Drop nric index if exists
  try {
    await db.collection("users").dropIndex("nric_1").catch(() => {});
    console.log("Dropped nric_1 index");
  } catch (e) {
    console.warn("Index drop:", e.message);
  }

  console.log("Migration complete.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
