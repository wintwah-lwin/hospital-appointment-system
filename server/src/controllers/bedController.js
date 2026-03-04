import Bed from "../models/Bed.js";

export const getBeds = async (req, res) => {
  const beds = await Bed.find().sort({ bedId: 1 });
  res.json(beds);
};

export const addBed = async (req, res) => {
  const { bedId, ward, type, status } = req.body || {};
  if (!bedId || !ward || !type) {
    return res.status(400).json({ message: "bedId, ward, and type are required" });
  }
  const bed = await Bed.create({ bedId, ward, type, status });
  res.status(201).json(bed);
};

export const toggleBedStatus = async (req, res) => {
  const { id } = req.params;
  const bed = await Bed.findById(id);
  if (!bed) return res.status(404).json({ message: "Bed not found" });

  bed.status = bed.status === "Available" ? "Occupied" : "Available";
  await bed.save();
  res.json(bed);
};

export const deleteBed = async (req, res) => {
  const { id } = req.params;
  const deleted = await Bed.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Bed not found" });
  res.json({ ok: true });
};
