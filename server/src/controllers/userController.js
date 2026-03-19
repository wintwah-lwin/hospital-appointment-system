import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

export const getPatientById = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select("_id email displayName dob createdAt role isBanned").lean();
  if (!user) return res.status(404).json({ message: "Patient not found" });
  if (user.role !== "patient") return res.status(404).json({ message: "Not found" });
  res.json(user);
};

export const listPatients = async (req, res) => {
  const patients = await User.find({ role: "patient" })
    .select("_id email displayName dob createdAt isBanned")
    .sort({ createdAt: -1 })
    .lean();
  res.json(patients);
};

export const banPatient = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Patient not found" });
  if (user.role !== "patient") return res.status(404).json({ message: "Not found" });
  user.isBanned = true;
  await user.save();
  res.json({ ok: true, isBanned: true });
};

export const unbanPatient = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Patient not found" });
  if (user.role !== "patient") return res.status(404).json({ message: "Not found" });
  user.isBanned = false;
  await user.save();
  res.json({ ok: true, isBanned: false });
};

export const deletePatient = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ message: "Patient not found" });
  if (user.role !== "patient") return res.status(404).json({ message: "Not found" });
  await Appointment.deleteMany({ patientUserId: id });
  await User.findByIdAndDelete(id);
  res.json({ ok: true });
};
