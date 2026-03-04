import Bed from "../models/Bed.js";
import Emergency from "../models/Emergency.js";

export const getSnapshot = async (req, res) => {
  const totalBeds = await Bed.countDocuments();
  const availableBeds = await Bed.countDocuments({ status: "Available" });
  const icuAvailable = await Bed.countDocuments({ ward: "ICU", status: "Available" });
  const erQueue = await Emergency.countDocuments();

  const alertLevel = availableBeds < 10 ? "high" : availableBeds < 30 ? "moderate" : "low";

  res.json({
    totalBeds,
    availableBeds,
    icuAvailable,
    erQueue,
    avgWaitMins: 38, // placeholder (later compute from queue / triage)
    alertLevel,
  });
};
