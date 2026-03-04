import Institution from "../models/Institution.js";

export const listInstitutions = async (req, res) => {
  const items = await Institution.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json(items);
};
