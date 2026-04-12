import React, { useState } from "react";

import { API_BASE } from "../../api/client.js";

const BASE = API_BASE;

async function lookup(email, appointmentId) {
  let res;
  try {
    res = await fetch(`${BASE}/api/appointments/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email ? { email } : { appointmentId })
    });
  } catch (err) {
    throw new Error(err?.message === "Failed to fetch" ? "Cannot reach server. Is the backend running?" : String(err?.message || err));
  }
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Lookup failed");
  try { return JSON.parse(text); } catch { throw new Error("Invalid response"); }
}

async function checkIn(id, email) {
  let res;
  try {
    res = await fetch(`${BASE}/api/appointments/${id}/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
  } catch (err) {
    throw new Error(err?.message === "Failed to fetch" ? "Cannot reach server. Is the backend running?" : String(err?.message || err));
  }
  const text = await res.text();
  if (!res.ok) {
    let err;
    try { err = JSON.parse(text); } catch { err = { message: text }; }
    throw new Error(err.message || err.instruction || text || "Check-in failed");
  }
  try { return JSON.parse(text); } catch { return {}; }
}

export default function CheckInKiosk() {
  const [email, setEmail] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [step, setStep] = useState("scan");
  const [appointment, setAppointment] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [instruction, setInstruction] = useState("");

  async function handleLookup(e) {
    e.preventDefault();
    setError("");
    setInstruction("");
    if (!email && !appointmentId) {
      setError("Enter email or scan your appointment barcode/QR");
      return;
    }
    try {
      const appt = await lookup(email || undefined, appointmentId || undefined);
      setAppointment(appt);
      setStep("confirm");
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  async function handleCheckIn() {
    setError("");
    setInstruction("");
    try {
      const res = await checkIn(appointment._id, appointment.patientEmail || email);
      setResult(res);
      setStep("done");
    } catch (err) {
      const msg = String(err?.message || err);
      setError(msg);
      if (msg.includes("Too early")) setInstruction("Please wait. Check-in opens 30 minutes before your appointment.");
      else if (msg.includes("Too late")) setInstruction("Please proceed to the counter for assistance.");
    }
  }

  function reset() {
    setStep("scan");
    setAppointment(null);
    setResult(null);
    setError("");
    setInstruction("");
    setEmail("");
    setAppointmentId("");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h1 className="text-2xl font-semibold text-center mb-6">Self Check-In Kiosk</h1>
        <p className="text-sm text-zinc-400 text-center mb-6">Scan barcode / QR or enter email</p>

        {step === "scan" && (
          <form onSubmit={handleLookup} className="space-y-4">
            <label className="block text-sm text-zinc-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-lg"
            />
            <div className="text-center text-zinc-500 text-sm">— or —</div>
            <label className="block text-sm text-zinc-400">Appointment ID</label>
            <input
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              placeholder="Scan barcode / QR"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3"
            />
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-medium">
              Look up appointment
            </button>
          </form>
        )}

        {step === "confirm" && appointment && (
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-800/50 p-4 space-y-2 text-sm">
              <div><span className="text-zinc-500">Clinic:</span> {appointment.category}</div>
              <div><span className="text-zinc-500">Time:</span> {new Date(appointment.startTime).toLocaleString()}</div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleCheckIn} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-medium">
                Check in
              </button>
              <button onClick={reset} className="rounded-xl border border-zinc-600 px-4 py-3">
                Cancel
              </button>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {instruction && <div className="text-amber-400 text-sm">{instruction}</div>}
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4 text-center">
            <div className="text-emerald-400 text-2xl font-bold">✓ Checked in</div>
            <div className="text-zinc-400 text-sm">Your token has been sent to your account.</div>
            <div className="text-4xl font-mono font-bold text-white">{result.queueNumber || result.token}</div>
            <div className="text-zinc-400">Your Token</div>
            <div className="rounded-xl bg-zinc-800/50 p-4 text-left text-sm space-y-2">
              <div><span className="text-zinc-500">Clinic room:</span> {result.clinicRoomNumber}</div>
              <div><span className="text-zinc-500">Est. waiting:</span> {result.estimatedWaitingMinutes} min</div>
            </div>
            <p className="text-sm text-zinc-500">Proceed to waiting area. Queue board will display your number.</p>
            <button onClick={reset} className="w-full rounded-xl bg-zinc-700 hover:bg-zinc-600 py-3">
              Next patient
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
