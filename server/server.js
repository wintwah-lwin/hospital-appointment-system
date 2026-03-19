import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { runReminderEmails } from "./src/jobs/reminderEmails.js";
import User from "./src/models/User.js";
import Institution from "./src/models/Institution.js";
import Bed from "./src/models/Bed.js";
import Doctor from "./src/models/Doctor.js";
import DoctorSchedule from "./src/models/DoctorSchedule.js";
import { hashPassword } from "./src/utils/password.js";
import dotenv from "dotenv";

dotenv.config();

await connectDB();

// Ensure email index unique (all users use email)
try {
  await User.collection.dropIndex("email_1").catch(() => {});
  await User.collection.dropIndex("nric_1").catch(() => {});
  await User.collection.createIndex({ email: 1 }, { unique: true });
  console.log("Email index: unique");
} catch (e) {
  console.warn("Index fix:", e.message);
}

async function ensureInstitutions() {
  const names = ["Singapore General Hospital", "National University Hospital", "Tan Tock Seng Hospital"];
  for (const name of names) {
    const exists = await Institution.findOne({ name });
    if (!exists) {
      await Institution.create({ name, code: name.split(" ").map(w => w[0]).join("").slice(0, 4), isActive: true });
      console.log("Created institution:", name);
    }
  }
}

async function ensureRooms() {
  const rooms = [
    { bedId: "Room-01", ward: "Clinic A", type: "Consultation" },
    { bedId: "Room-02", ward: "Clinic A", type: "Consultation" },
    { bedId: "Room-03", ward: "Clinic B", type: "Consultation" },
    { bedId: "Room-04", ward: "Clinic B", type: "Consultation" },
    { bedId: "Room-05", ward: "Clinic C", type: "Consultation" },
    { bedId: "Room-06", ward: "Cardiology", type: "Consultation" },
    { bedId: "Room-07", ward: "Neurology", type: "Consultation" },
    { bedId: "Room-08", ward: "Orthopedics", type: "Consultation" },
    { bedId: "Room-09", ward: "General", type: "Consultation" },
    { bedId: "Room-10", ward: "General", type: "Consultation" }
  ];
  for (const r of rooms) {
    const exists = await Bed.findOne({ bedId: r.bedId });
    if (!exists) {
      await Bed.create(r);
      console.log("Created room:", r.bedId);
    }
  }
}

async function ensureDoctorSchedules() {
  const doctors = await Doctor.find({});
  for (const d of doctors) {
    const exists = await DoctorSchedule.findOne({ doctorId: d._id });
    if (!exists) continue;
    if (exists.days && Array.isArray(exists.days) && exists.days.length > 0) {
      await DoctorSchedule.updateOne({ doctorId: d._id }, { $unset: { slots: "", workingDays: "" } });
      continue;
    }
    const defaultSlots = [
      { time: "09:00", room: "Room-01" },
      { time: "11:00", room: "Room-02" },
      { time: "14:00", room: "Room-03" },
      { time: "16:00", room: "Room-04" },
      { time: "17:00", room: "Room-05" }
    ];
    const oldSlots = Array.isArray(exists.slots) && exists.slots.length ? exists.slots.filter(s => s?.time && s?.room) : defaultSlots;
    const workingDays = Array.isArray(exists.workingDays) && exists.workingDays.length ? exists.workingDays : [1, 2, 3, 4, 5];
    const days = workingDays.map(dow => ({ dayOfWeek: dow, slots: [...oldSlots] }));
    await DoctorSchedule.updateOne({ doctorId: d._id }, { $set: { days }, $unset: { slots: "", workingDays: "" } });
    console.log("Migrated schedule for doctor:", d.name);
  }
}

async function ensureSystemUsers() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@intellicare.local").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    console.warn("SECURITY: ADMIN_PASSWORD not set in production. Set it in your hosting env vars.");
  }
  const staffSeed = (process.env.STAFF_SEED || "").trim();

  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashed = await hashPassword(adminPassword);
    await User.create({ email: adminEmail, password: hashed, role: "admin", displayName: "System Admin" });
    console.log("Created system admin:", adminEmail);
  }

  if (staffSeed) {
    const pairs = staffSeed.split(",").map(s => s.trim()).filter(Boolean);
    for (const pair of pairs) {
      const [emailRaw, pass] = pair.split(":");
      const email = (emailRaw || "").toLowerCase().trim();
      if (!email || !pass) continue;
      const exists = await User.findOne({ email });
      if (!exists) {
        const hashed = await hashPassword(pass);
        await User.create({ email, password: hashed, role: "staff", displayName: email.split("@")[0] });
        console.log("Created staff user:", email);
      }
    }
  }
}

await ensureInstitutions();
await ensureRooms();
await ensureDoctorSchedules();
await ensureSystemUsers();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// Appointment reminder emails (12h and 3h before) – runs every 15 minutes
const REMINDER_INTERVAL_MS = 15 * 60 * 1000;
setInterval(runReminderEmails, REMINDER_INTERVAL_MS);
runReminderEmails().catch((e) => console.warn("Initial reminder run:", e?.message));
