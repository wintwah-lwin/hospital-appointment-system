import Announcement from "../models/Announcement.js";

export const listAnnouncements = async (req, res) => {
  const now = new Date();
  const items = await Announcement.find({
    activeFrom: { $lte: now },
    $or: [{ activeTo: null }, { activeTo: { $gte: now } }]
  }).sort({ priority: -1, createdAt: -1 }).limit(50).lean();

  res.json(items);
};

export const createAnnouncement = async (req, res) => {
  const { title, body, priority = "normal", activeFrom, activeTo } = req.body || {};
  if (!title || !body) return res.status(400).json({ message: "title and body required" });

  const item = await Announcement.create({
    title,
    body,
    priority,
    activeFrom: activeFrom ? new Date(activeFrom) : new Date(),
    activeTo: activeTo ? new Date(activeTo) : null,
    createdByAdminId: req.user.id
  });

  res.status(201).json(item);
};

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  await Announcement.deleteOne({ _id: id });
  res.json({ ok: true });
};
