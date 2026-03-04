import Department from "../models/Department.js";

export const getDepartments = async (req, res) => {
  const depts = await Department.find().sort({ name: 1 });
  res.json(depts);
};
