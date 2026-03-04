import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import User from "./src/models/User.js";
import Institution from "./src/models/Institution.js";
import Bed from "./src/models/Bed.js";
import Doctor from "./src/models/Doctor.js";
import DoctorSchedule from "./src/models/DoctorSchedule.js";
import { hashPassword } from "./src/utils/password.js";
import dotenv from "dotenv";

dotenv.config();

await connectDB();

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
  const defaultSlots = [
    { time: "09:00", room: "Room-01" },
    { time: "11:00", room: "Room-02" },
    { time: "14:00", room: "Room-03" },
    { time: "16:00", room: "Room-04" },
    { time: "17:00", room: "Room-05" }
  ];
  const doctors = await Doctor.find({});
  for (const d of doctors) {
    const exists = await DoctorSchedule.findOne({ doctorId: d._id });
    if (!exists) {
      await DoctorSchedule.create({ doctorId: d._id, slots: defaultSlots });
      console.log("Created schedule for doctor:", d.name);
    } else if (!exists.slots || !Array.isArray(exists.slots) || exists.slots.length === 0) {
      const legacy = exists.sections || [exists.slot1Time, exists.slot2Time, exists.slot3Time].filter(Boolean);
      const times = [...new Set(legacy)].filter(s => ["09:00", "11:00", "14:00", "16:00", "17:00"].includes(s));
      const rooms = ["Room-01", "Room-02", "Room-03", "Room-04", "Room-05"];
      const migrated = times.length ? times.map((t, i) => ({ time: t, room: d.room || rooms[i % 5] })) : defaultSlots;
      await DoctorSchedule.updateOne({ doctorId: d._id }, { $set: { slots: migrated } });
      console.log("Migrated schedule for doctor:", d.name);
    }
  }
}

async function ensureSystemUsers() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@intellicare.local").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
