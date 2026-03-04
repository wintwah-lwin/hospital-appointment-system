import Emergency from "../models/Emergency.js";

function genTicket() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `E-${n}`;
}

export const getEmergencyQueue = async (req, res) => {
  const queue = await Emergency.find().sort({ createdAt: -1 });
  res.json(queue);
};

export const addEmergency = async (req, res) => {
  const { ticket, priority, etaMins, notes } = req.body || {};
  const safeTicket = (ticket && String(ticket).trim()) || genTicket();
  const safePriority = priority || "High";
  const safeEta = Number.isFinite(Number(etaMins)) ? Number(etaMins) : 10;

  const item = await Emergency.create({
    ticket: safeTicket,
    priority: safePriority,
    etaMins: safeEta,
    notes: notes || "",
  });
  res.status(201).json(item);
};

export const deleteEmergency = async (req, res) => {
  const { id } = req.params;
  const deleted = await Emergency.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ message: "Ticket not found" });
  res.json({ ok: true });
};
