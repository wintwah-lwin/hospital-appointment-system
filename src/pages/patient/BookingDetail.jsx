import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../api/client.js";
import { Link, useNavigate, useParams } from "react-router-dom";

const CHECKED_IN_STATUSES = ["Checked-In", "Waiting", "In Consultation"];

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appt, setAppt] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const a = await apiGet(`/api/appointments/${id}`);
      setAppt(a);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function cancel() {
    if (!confirm("Cancel this booking?")) return;
    try {
      await apiPost(`/api/appointments/${id}/cancel`, {});
      navigate("/patient/bookings");
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  const isCheckedIn = appt && CHECKED_IN_STATUSES.includes(appt.status);
  const canEdit = appt?.status === "Booked";

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;
  if (err) return <div className="p-8 text-red-600">{err}</div>;
  if (!appt) return <div className="p-8 text-slate-500">Booking not found</div>;

  return (
    <div className="max-w-2xl">
      <Link to="/patient/bookings" className="text-sm text-slate-600 hover:text-slate-900 mb-4 inline-block">← Back to My bookings</Link>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Booking details</h1>
        <div className="space-y-3 text-sm">
          <div><span className="text-slate-500">Appointment ID:</span> <span className="font-mono text-slate-900">{appt.appointmentId || appt._id}</span></div>
          <div><span className="text-slate-500">Doctor:</span> {appt.doctorNameSnapshot || "-"}</div>
          <div><span className="text-slate-500">Specialty:</span> {appt.category || "-"}</div>
          <div><span className="text-slate-500">Date & time:</span> {new Date(appt.startTime).toLocaleString()}</div>
          <div><span className="text-slate-500">Queue:</span> {appt.queueCategory || "-"}</div>
          <div><span className="text-slate-500">Status:</span> <span className="font-medium text-slate-900">{appt.status}</span></div>
          {appt.queueNumber && <div><span className="text-slate-500">Token:</span> <span className="font-mono font-bold text-primary-600">#{appt.queueNumber}</span></div>}
          {isCheckedIn && appt.clinicRoomNumber && <div><span className="text-slate-500">Room:</span> {appt.clinicRoomNumber}</div>}
          {appt.notes && <div><span className="text-slate-500">Notes:</span> {appt.notes}</div>}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {canEdit && (
            <>
              <Link to={`/patient/bookings/${id}/edit`} className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 text-sm">
                Edit / Reschedule
              </Link>
              <button onClick={cancel} className="px-4 py-2 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 text-sm">
                Cancel booking
              </button>
            </>
          )}
          <Link to="/patient/bookings" className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm">
            Back to list
          </Link>
        </div>
      </div>
    </div>
  );
}
