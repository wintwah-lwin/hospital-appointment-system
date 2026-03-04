import Notification from "../models/Notification.js";

export const listMyNotifications = async (req, res) => {
  const items = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(200).lean();
  res.json(items);
};

export const markAllRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
  res.json({ ok: true });
};
