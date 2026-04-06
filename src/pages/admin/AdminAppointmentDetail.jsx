import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiGet } from "../../api/client.js";
import { TZ_SG, anchorSlotLabelForAppointment } from "./appointmentUtils.js";

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[10rem,1fr] gap-1 sm:gap-4 py-3 border-b border-zinc-100 last:border-0">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

export default function AdminAppointmentDetail() {
  const { id } = useParams();
  const location = useLocation();
  const backTo = typeof location.state?.from === "string" && location.state.from.startsWith("/") ? location.state.from : "/admin/appointments";

  const [a, setA] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      try {
        const data = await apiGet(`/api/appointments/${id}`);
        if (!cancelled) setA(data);
      } catch (e) {
        if (!cancelled) {
          setErr(String(e?.message || e));
          setA(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (err && !a) {
    return (
      <div className="max-w-2xl space-y-4">
        <Link to={backTo} className="text-sm font-medium text-teal-600 hover:underline">← Back</Link>
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm">{err}</div>
      </div>
    );
  }

  if (!a) {
    return (
      <div className="max-w-2xl">
        <Link to={backTo} className="text-sm font-medium text-teal-600 hover:underline">← Back</Link>
        <p className="mt-4 text-zinc-500">Loading…</p>
      </div>
    );
  }

  const ymd = a.startTime ? new Date(a.startTime).toLocaleDateString("en-CA", { timeZone: TZ_SG }) : "";
  const band = anchorSlotLabelForAppointment(a, ymd);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={backTo} className="text-sm font-medium text-teal-600 hover:underline">← Back to list</Link>
        <span className="text-xs text-zinc-500 font-mono">{String(a._id)}</span>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm p-6">
        <h1 className="text-xl font-semibold text-zinc-900 mb-1">Appointment detail</h1>
        <p className="text-sm text-zinc-500 mb-6">{a.patientName || "Patient"} · {a.status}</p>

        <dl>
          <Row label="Patient name">{a.patientName || "—"}</Row>
          <Row label="Patient email">{a.patientEmail || "—"}</Row>
          <Row label="Doctor">{a.doctorNameSnapshot || "—"}</Row>
          <Row label="Category">{a.category || "—"}</Row>
          <Row label="Queue">{a.queueCategory || "—"}{a.queueNumber ? ` · ${a.queueNumber}` : ""}</Row>
          <Row label="Room">{a.clinicRoomNumber || a.roomIdSnapshot || "—"}</Row>
          <Row label="Start">{a.startTime ? new Date(a.startTime).toLocaleString("en-SG", { timeZone: TZ_SG, dateStyle: "full", timeStyle: "short" }) : "—"}</Row>
          <Row label="End">{a.endTime ? new Date(a.endTime).toLocaleString("en-SG", { timeZone: TZ_SG, dateStyle: "full", timeStyle: "short" }) : "—"}</Row>
          <Row label="Timetable band">
            {band}
          </Row>
          <Row label="Referral">{a.referralRequired ? (a.hasReferral ? "Has referral" : "Required — not recorded") : "Not required"}</Row>
          <Row label="Booking source">{a.bookingSource || "—"}</Row>
          <Row label="Created by">{a.createdByRole || "—"}</Row>
          <Row label="Notes">
            {a.notes && String(a.notes).trim() ? (
              <span className="whitespace-pre-wrap block rounded-lg bg-zinc-50 px-3 py-2 border border-zinc-100">{a.notes}</span>
            ) : (
              <span className="text-zinc-400">No notes</span>
            )}
          </Row>
        </dl>
      </div>
    </div>
  );
}
