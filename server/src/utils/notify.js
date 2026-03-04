import Notification from "../models/Notification.js";
import User from "../models/User.js";

export async function notifyUser({ userId, role, type, message, appointmentId = null }) {
  return Notification.create({ userId, role, type, message, appointmentId });
}

export async function notifyAdmins({ type, message, appointmentId = null }) {
  const admins = await User.find({ role: "admin" }).select("_id role").lean();
  await Promise.all(admins.map(a => Notification.create({ userId: a._id, role: "admin", type, message, appointmentId })));
}

export async function notifyStaff({ type, message, appointmentId = null }) {
  const staff = await User.find({ role: "staff" }).select("_id role").lean();
  await Promise.all(staff.map(s => Notification.create({ userId: s._id, role: "staff", type, message, appointmentId })));
}
