import Bed from "../models/Bed.js";
import Appointment from "../models/Appointment.js";
import { SLOT_MINUTES, addMinutes } from "../utils/availability.js";

const BLOCKING = ["PENDING_ADMIN", "APPROVED"];

export const listRoomAvailability = async (req, res) => {
  const start = req.query.startTime ? new Date(req.query.startTime) : new Date();
  const startTime = Number.isNaN(start.getTime()) ? new Date() : start;
  const endTime = addMinutes(startTime, SLOT_MINUTES);

  const beds = await Bed.find({}).sort({ bedId: 1 }).lean();
  const conflicts = await Appointment.find({
    status: { $in: BLOCKING },
    roomId: { $ne: null },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  }).select("roomId").lean();

  const occupied = new Set(conflicts.map(c => String(c.roomId)));

  const result = beds.map(b => ({
    _id: b._id,
    roomCode: b.bedId,
    ward: b.ward,
    type: b.type,
    isAvailable: !occupied.has(String(b._id)) && b.status === "Available"
  }));

  res.json({ slotMinutes: SLOT_MINUTES, startTime, endTime, rooms: result });
};
