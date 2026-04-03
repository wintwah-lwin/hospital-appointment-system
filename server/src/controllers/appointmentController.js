import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Bed from "../models/Bed.js";
import User from "../models/User.js";
import { addMinutes, validateBookingWindow, isDoctorAvailable, findAvailableRoom, BLOCKING_STATUSES, sessionPartWindow, CONSULT_MIN } from "../utils/availability.js";
import { getDoctorSchedule, isSlotInSchedule, getSlotsForDay, isAnchorInSchedule, anchorTimeLabelSG, slotToDate } from "../utils/schedule.js";
import { notifyUser } from "../utils/notify.js";

const SPECIALIST_CATEGORIES = ["Cardiology", "Neurology", "Orthopedics"];

function normalizeCategory(raw) {
  const v = String(raw || "").trim();
  if (v === "Normal") return "General";
  return v;
}

function patientAllowedCategory(category) {
  return ["General", "Cardiology", "Neurology", "Orthopedics"].includes(category);
}

async function pickDoctorSlotRoom({ doctorId, slotAnchorTime, consultStart }) {
  const sched = await getDoctorSchedule(doctorId);
  const anchor = slotAnchorTime ? new Date(slotAnchorTime) : null;
  if (anchor) {
    const dayOfWeek = anchor.getDay();
    const slots = getSlotsForDay(sched, dayOfWeek);
    const time = anchorTimeLabelSG(anchor);
    const slot = slots.find(s => String(s.time) === time);
    if (!slot?.room) return { ok: false, reason: "Doctor slot room is not configured" };
    const bed = await Bed.findOne({ bedId: slot.room }).lean();
    if (!bed) return { ok: false, reason: `Configured room ${slot.room} not found` };
    return { ok: true, bed };
  }
  const d = new Date(consultStart);
  const dayOfWeek = d.getDay();
  const slots = getSlotsForDay(sched, dayOfWeek);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(d);
  const y = parts.find(p => p.type === "year").value;
  const mo = parts.find(p => p.type === "month").value;
  const da = parts.find(p => p.type === "day").value;
  const dateStr = `${y}-${mo}-${da}`;
  for (const s of slots) {
    const anch = slotToDate(dateStr, s.time);
    for (const part of [1, 2]) {
      const { start, end } = sessionPartWindow(anch, part);
      if (d >= start && d < end) {
        const bed = await Bed.findOne({ bedId: s.room }).lean();
        if (!bed) return { ok: false, reason: `Configured room ${s.room} not found` };
        return { ok: true, bed };
      }
    }
  }
  return { ok: false, reason: "No room for this time in schedule" };
}

export const createAppointment = async (req, res) => {
  const { category, doctorId, notes, queueCategory, slotAnchorTime, slotPart } = req.body || {};
  const user = req.user;

  const patientUser = await User.findById(user.id).select("email displayName isBanned").lean();
  if (patientUser?.isBanned) return res.status(403).json({ message: "You cannot make bookings because your account has been banned. Please contact support." });

  const cat = normalizeCategory(category);
  if (!patientAllowedCategory(cat)) return res.status(403).json({ message: "Invalid specialty" });

  const part = Number(slotPart);
  if (part !== 1 && part !== 2) {
    return res.status(400).json({ message: "slotPart must be 1 (first session) or 2 (second session)" });
  }
  const anchor = slotAnchorTime ? new Date(slotAnchorTime) : null;
  if (!anchor || Number.isNaN(anchor.getTime())) {
    return res.status(400).json({ message: "slotAnchorTime is required (timetable slot start, e.g. 9:00)" });
  }

  const { start, end } = sessionPartWindow(anchor, part);

  const windowCheck = await validateBookingWindow({ startTime: start });
  if (!windowCheck.ok) return res.status(400).json({ message: windowCheck.reason });

  // Referral check for specialists
  if (SPECIALIST_CATEGORIES.includes(cat) && !req.body.hasReferral) {
    return res.status(400).json({ message: "Referral required for specialist appointments" });
  }

  const patientClash = await Appointment.findOne({
    patientUserId: user.id,
    status: { $in: BLOCKING_STATUSES },
    startTime: { $lt: end },
    endTime: { $gt: start }
  }).lean();
  if (patientClash) {
    return res.status(409).json({
      message: "You already have an appointment that overlaps this time. Cancel or reschedule the other booking first."
    });
  }

  let docId = doctorId || null;
  let docSnap = "";

  if (docId) {
    const doctor = await Doctor.findById(docId).lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const sched = await getDoctorSchedule(docId);
    if (!isAnchorInSchedule(sched, anchor)) {
      return res.status(400).json({ message: "Selected slot is not in the doctor's timetable. Please choose an available slot." });
    }
    const docAvail = await isDoctorAvailable({ doctorId: docId, startTime: start, endTime: end });
    if (!docAvail.ok) return res.status(409).json({ message: "Slot unavailable: " + docAvail.reason });
    docSnap = doctor.name;
  }

  const roomPick = docId
    ? await pickDoctorSlotRoom({ doctorId: docId, slotAnchorTime: anchor, consultStart: start })
    : await findAvailableRoom({ startTime: start, endTime: end });
  if (!roomPick.ok) return res.status(409).json({ message: "No available slot: " + roomPick.reason });

  const qCat = ["New", "Follow-up", "Priority"].includes(queueCategory) ? queueCategory : "New";

  const appt = await Appointment.create({
    patientUserId: user.id,
    patientName: (user.displayName && String(user.displayName).trim()) ? String(user.displayName).trim() : (patientUser?.displayName || "Patient"),
    patientEmail: (patientUser?.email || user.email || "").toLowerCase().trim(),
    category: cat,
    doctorId: docId,
    doctorNameSnapshot: docSnap,
    roomId: roomPick.bed._id,
    roomIdSnapshot: roomPick.bed.bedId,
    clinicRoomNumber: roomPick.bed.bedId || "",
    startTime: start,
    endTime: end,
    status: "Booked",
    queueCategory: qCat,
    referralRequired: SPECIALIST_CATEGORIES.includes(cat),
    hasReferral: !!req.body.hasReferral,
    bookingSource: "online",
    createdByRole: "patient",
    createdByUserId: user.id,
    notes: notes || "",
    slotAnchorTime: anchor,
    slotPart: part
  });

  await notifyUser({ userId: user.id, role: "patient", type: "BOOKED", message: "Appointment booked successfully.", appointmentId: appt._id });

  res.status(201).json({
    _id: appt._id,
    status: appt.status,
    appointmentId: String(appt._id),
    queueCategory: appt.queueCategory,
    doctorNameSnapshot: appt.doctorNameSnapshot,
    startTime: appt.startTime,
    endTime: appt.endTime,
    clinicRoomNumber: appt.clinicRoomNumber,
    slotPart: appt.slotPart,
    slotAnchorTime: appt.slotAnchorTime
  });
};

export const listMyAppointments = async (req, res) => {
  const appts = await Appointment.find({
    patientUserId: req.user.id,
    status: { $ne: "Cancelled" }
  })
    .sort({ startTime: -1 })
    .lean();
  res.json(appts);
};

export const listAllAppointments = async (req, res) => {
  const appts = await Appointment.find({}).sort({ startTime: -1 }).lean();
  const userIds = [...new Set(appts.map(a => a.patientUserId).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).select("_id displayName").lean();
  const userMap = Object.fromEntries(users.map(u => [String(u._id), u.displayName]));
  const enriched = appts.map(a => {
    const displayName = userMap[String(a.patientUserId)];
    const name = (displayName && String(displayName).trim()) ? String(displayName).trim() : "Patient";
    return { ...a, patientName: name };
  });
  res.json(enriched);
};

const SG_TZ = "Asia/Singapore";

export const listAppointmentsByRoomAndDate = async (req, res) => {
  const { room, date } = req.query;
  if (!room || !date) {
    return res.status(400).json({ message: "Query params room and date are required (e.g. ?room=Room-01&date=2026-04-03)" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return res.status(400).json({ message: "date must be YYYY-MM-DD" });
  }

  const appts = await Appointment.find({
    $or: [{ clinicRoomNumber: room }, { roomIdSnapshot: room }]
  })
    .sort({ startTime: 1 })
    .lean();

  const filtered = appts.filter(a => {
    const d = a.startTime ? new Date(a.startTime).toLocaleDateString("en-CA", { timeZone: SG_TZ }) : "";
    return d === date;
  });

  const userIds = [...new Set(filtered.map(a => a.patientUserId).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } }).select("_id displayName").lean();
  const userMap = Object.fromEntries(users.map(u => [String(u._id), u.displayName]));
  const enriched = filtered.map(a => {
    const displayName = userMap[String(a.patientUserId)];
    const name = (displayName && String(displayName).trim()) ? String(displayName).trim() : (a.patientName || "Patient");
    return { ...a, patientName: name };
  });
  res.json(enriched);
};

export const getQueueForDoctor = async (req, res) => {
  const { doctorId } = req.query;
  const query = {
    status: { $in: ["Checked-In", "Waiting", "In Consultation"] }
  };
  if (doctorId) query.doctorId = doctorId;

  const appts = await Appointment.find(query)
    .sort({ queueCategory: -1, startTime: 1, checkedInAt: 1 })
    .lean();
  res.json(appts);
};

export const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });

  const isAdmin = req.user.role === "admin";
  const isOwner = String(appt.patientUserId) === String(req.user.id);

  if (!isAdmin && !isOwner) return res.status(403).json({ message: "Forbidden" });
  if (appt.status !== "Booked") return res.status(400).json({ message: "Only Booked appointments can be cancelled" });

  appt.status = "Cancelled";
  await appt.save();

  await notifyUser({ userId: appt.patientUserId, role: "patient", type: "CANCELLED", message: "Appointment cancelled.", appointmentId: appt._id });

  res.json(appt);
};

export const editAppointment = async (req, res) => {
  const { id } = req.params;
  const { category, doctorId, startTime, notes, queueCategory, slotAnchorTime, slotPart } = req.body || {};

  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });

  const isAdmin = req.user.role === "admin";
  const isOwner = String(appt.patientUserId) === String(req.user.id);
  if (!isAdmin && !isOwner) return res.status(403).json({ message: "Forbidden" });
  if (appt.status !== "Booked") return res.status(400).json({ message: "Only Booked appointments can be rescheduled" });

  if (!isAdmin) {
    const hoursUntil = (new Date(appt.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 24) return res.status(400).json({ message: "Rescheduling is only allowed at least 24 hours before your appointment time." });
  }

  const cat = category ? normalizeCategory(category) : appt.category;

  let start;
  let end;
  let anchor;
  let partNum;

  if (slotAnchorTime && (Number(slotPart) === 1 || Number(slotPart) === 2)) {
    anchor = new Date(slotAnchorTime);
    partNum = Number(slotPart);
    if (Number.isNaN(anchor.getTime())) return res.status(400).json({ message: "Invalid slotAnchorTime" });
    const win = sessionPartWindow(anchor, partNum);
    start = win.start;
    end = win.end;
  } else {
    start = startTime ? new Date(startTime) : appt.startTime;
    if (Number.isNaN(start.getTime())) return res.status(400).json({ message: "Invalid startTime" });
    const durMin =
      appt.startTime && appt.endTime
        ? Math.max(1, Math.round((new Date(appt.endTime) - new Date(appt.startTime)) / 60000))
        : CONSULT_MIN;
    end = addMinutes(start, durMin);
    anchor = appt.slotAnchorTime ? new Date(appt.slotAnchorTime) : null;
    partNum = appt.slotPart;
  }

  const windowCheck = await validateBookingWindow({ startTime: start });
  if (!windowCheck.ok) return res.status(400).json({ message: windowCheck.reason });

  const patientClash = await Appointment.findOne({
    patientUserId: appt.patientUserId,
    status: { $in: BLOCKING_STATUSES },
    startTime: { $lt: end },
    endTime: { $gt: start },
    _id: { $ne: appt._id }
  }).lean();
  if (patientClash) {
    return res.status(409).json({ message: "You already have another appointment that overlaps this time." });
  }

  let docId = appt.doctorId;
  let docSnap = appt.doctorNameSnapshot;

  const newDoctorId = doctorId ?? appt.doctorId;
  if (newDoctorId) {
    const docAvail = await isDoctorAvailable({ doctorId: newDoctorId, startTime: start, endTime: end, ignoreAppointmentId: appt._id });
    if (!docAvail.ok) return res.status(409).json({ message: "Slot unavailable" });
    const doctor = await Doctor.findById(newDoctorId).lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    docId = newDoctorId;
    docSnap = doctor.name;
  }
  if (docId) {
    const sched = await getDoctorSchedule(docId);
    if (anchor && (partNum === 1 || partNum === 2)) {
      if (!isAnchorInSchedule(sched, anchor)) return res.status(400).json({ message: "Selected slot is not in the doctor's timetable." });
    } else if (!isSlotInSchedule(sched, null, start)) {
      return res.status(400).json({ message: "Selected time is not in the doctor's timetable." });
    }
  }

  const roomPick = docId
    ? await pickDoctorSlotRoom({ doctorId: docId, slotAnchorTime: anchor, consultStart: start })
    : await findAvailableRoom({ startTime: start, endTime: end });
  if (!roomPick.ok) return res.status(409).json({ message: "No available slot: " + (roomPick.reason || "") });

  appt.category = cat;
  appt.doctorId = docId;
  appt.doctorNameSnapshot = docSnap;
  appt.startTime = start;
  appt.endTime = end;
  appt.roomId = roomPick.bed._id;
  appt.roomIdSnapshot = roomPick.bed.bedId;
  appt.clinicRoomNumber = roomPick.bed.bedId || "";
  if (anchor && (partNum === 1 || partNum === 2)) {
    appt.slotAnchorTime = anchor;
    appt.slotPart = partNum;
  }
  if (notes !== undefined) appt.notes = notes;
  if (queueCategory) appt.queueCategory = ["New", "Follow-up", "Priority"].includes(queueCategory) ? queueCategory : appt.queueCategory;

  await appt.save();

  await notifyUser({ userId: appt.patientUserId, role: "patient", type: "EDITED", message: "Appointment rescheduled.", appointmentId: appt._id });

  res.json(appt);
};

export const getAppointmentById = async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findById(id).lean();
  if (!appt) return res.status(404).json({ message: "Not found" });
  const isAdmin = req.user?.role === "admin" || req.user?.role === "staff";
  const isOwner = req.user && String(appt.patientUserId) === String(req.user.id);
  if (req.user && !isAdmin && !isOwner) return res.status(403).json({ message: "Forbidden" });
  res.json(appt);
};

// --- Check-in & Queue (Singapore style) ---

export const lookupAppointment = async (req, res) => {
  const { email, appointmentId } = req.body || {};
  if (!email && !appointmentId) return res.status(400).json({ message: "Email or Appointment ID required" });

  const query = { status: "Booked" };
  if (appointmentId) query._id = appointmentId;
  if (email) query.patientEmail = String(email).trim().toLowerCase();

  const appt = await Appointment.findOne(query)
    .populate("roomId", "bedId")
    .lean();

  if (!appt) return res.status(404).json({ message: "No Booked appointment found" });
  res.json(appt);
};

export const checkIn = async (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });
  if (appt.status !== "Booked") return res.status(400).json({ message: "Appointment is not in Booked status" });

  if (req.user) {
    const isStaff = req.user.role === "staff" || req.user.role === "admin";
    const isOwner = String(appt.patientUserId) === String(req.user.id);
    if (!isStaff && !isOwner) return res.status(403).json({ message: "Forbidden" });
  } else {
    if (!email || String(email).trim().toLowerCase() !== String(appt.patientEmail || "").toLowerCase()) {
      return res.status(401).json({ message: "Email required for kiosk check-in" });
    }
  }

  const now = new Date();
  const checkInWindowStart = new Date(appt.startTime);
  checkInWindowStart.setMinutes(checkInWindowStart.getMinutes() - 30);
  const checkInWindowEnd = new Date(appt.endTime);
  checkInWindowEnd.setMinutes(checkInWindowEnd.getMinutes() + 15);

  if (now < checkInWindowStart) {
    return res.status(400).json({
      message: "Too early",
      instruction: "Please wait. Check-in opens 30 minutes before your appointment.",
      nextCheckInAt: checkInWindowStart
    });
  }
  if (now > checkInWindowEnd) {
    return res.status(400).json({
      message: "Too late",
      instruction: "Please proceed to the counter for assistance."
    });
  }

  const queuePrefix = appt.queueCategory === "Priority" ? "P" : appt.queueCategory === "Follow-up" ? "F" : "N";
  const count = await Appointment.countDocuments({
    status: { $in: ["Checked-In", "Waiting"] },
    queueCategory: appt.queueCategory,
    startTime: { $lte: appt.startTime }
  });
  const queueNumber = `${queuePrefix}-${String(count + 1).padStart(3, "0")}`;

  appt.status = "Checked-In";
  appt.checkedInAt = now;
  appt.queueNumber = queueNumber;
  appt.estimatedWaitingMinutes = 15 + count * 10;
  appt.clinicRoomNumber = appt.roomIdSnapshot || appt.clinicRoomNumber || "";

  await appt.save();

  await notifyUser({
    userId: appt.patientUserId,
    role: "patient",
    type: "CHECKED_IN",
    message: `Your token is ${appt.queueNumber}. Proceed to waiting area. Room: ${appt.clinicRoomNumber}. Est. wait: ${appt.estimatedWaitingMinutes} min.`,
    appointmentId: appt._id
  });

  res.json({
    status: appt.status,
    queueNumber: appt.queueNumber,
    token: appt.queueNumber,
    clinicRoomNumber: appt.clinicRoomNumber,
    estimatedWaitingMinutes: appt.estimatedWaitingMinutes
  });
};

export const callPatient = async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });
  if (appt.status !== "Checked-In" && appt.status !== "Waiting") {
    return res.status(400).json({ message: "Patient must be Checked-In or Waiting" });
  }

  appt.status = "In Consultation";
  appt.consultationStartedAt = new Date();
  await appt.save();

  res.json(appt);
};

export const completeConsultation = async (req, res) => {
  const { id } = req.params;
  const { routeTo } = req.body || {};
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });
  if (appt.status !== "In Consultation") return res.status(400).json({ message: "Appointment is not in consultation" });

  appt.status = "Completed";
  appt.completedAt = new Date();
  appt.notes = appt.notes ? `${appt.notes}\n[Route: ${routeTo || "N/A"}]` : `[Route: ${routeTo || "N/A"}]`;
  await appt.save();

  res.json(appt);
};

export const markNoShow = async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });
  if (appt.status !== "Checked-In") return res.status(400).json({ message: "Only Checked-In can be marked No Show" });

  appt.status = "No Show";
  await appt.save();

  res.json(appt);
};

export const setStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const valid = ["Booked", "Checked-In", "Waiting", "In Consultation", "Completed", "Cancelled", "No Show"];
  if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status" });

  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });

  appt.status = status;
  if (status === "In Consultation") appt.consultationStartedAt = new Date();
  if (status === "Completed") {
    appt.completedAt = new Date();
    await notifyUser({ userId: appt.patientUserId, role: "patient", type: "COMPLETED", message: "Thank you for your visit! Your consultation is complete.", appointmentId: appt._id });
  }
  if (status === "Checked-In" || status === "Waiting") appt.checkedInAt = appt.checkedInAt || new Date();
  await appt.save();

  res.json(appt);
};

export const completeAndDelete = async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findById(id);
  if (!appt) return res.status(404).json({ message: "Not found" });

  await Appointment.deleteOne({ _id: id });
  res.json({ ok: true, deleted: true });
};

export const clearAllAppointments = async (req, res) => {
  const result = await Appointment.deleteMany({});
  res.json({ ok: true, deleted: result.deletedCount });
};
