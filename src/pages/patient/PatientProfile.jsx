import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPatch } from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";

function formatDobForInput(dob) {
  if (!dob) return "";
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function PatientProfile() {
  const { user, refreshMe } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [bookings, setBookings] = useState([]);
  const [profileErr, setProfileErr] = useState("");
  const [profileOk, setProfileOk] = useState("");
  const [saving, setSaving] = useState(false);
  const [bookErr, setBookErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const mustChangeOnly = !!user?.mustChangePassword;

  async function loadMe() {
    try {
      const { user: u } = await apiGet("/api/auth/me");
      if (u) {
        setEmail(u.email || "");
        setDisplayName(u.displayName || "");
        setPhone(u.phone || "");
        setDob(formatDobForInput(u.dob));
      }
    } catch (e) {
      setProfileErr(String(e?.message || e));
    }
  }

  async function loadBookings() {
    setBookErr("");
    try {
      const data = await apiGet("/api/appointments/mine");
      setBookings(data || []);
    } catch (e) {
      setBookErr(String(e?.message || e));
    }
  }

  useEffect(() => {
    loadMe();
    loadBookings();
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileErr("");
    setProfileOk("");
    setPwErr("");
    setPwOk("");
    setSaving(true);
    try {
      await apiPatch("/api/auth/profile", { email, displayName, phone, dob: dob || null });
      await refreshMe();
      setProfileOk("Profile saved.");
    } catch (err) {
      setProfileErr(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwErr("");
    setPwOk("");
    setProfileErr("");
    setProfileOk("");
    if (newPassword !== confirmPassword) {
      setPwErr("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    try {
      const body = mustChangeOnly
        ? { newPassword }
        : { currentPassword, newPassword };
      await apiPatch("/api/auth/password", body);
      await refreshMe();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwOk("Password updated.");
    } catch (err) {
      setPwErr(String(err?.message || err));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-10 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      <form onSubmit={saveProfile} className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 max-w-xl">
        <h2 className="font-semibold text-slate-900">Your information</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date of birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        {profileErr && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{profileErr}</div>}
        {profileOk && <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">{profileOk}</div>}
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-lg bg-[#0d9488] text-white font-medium disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <form onSubmit={savePassword} className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 max-w-xl">
        <h2 className="font-semibold text-slate-900">Change password</h2>
        <p className="text-sm text-slate-600">
          Use at least 8 characters, including a letter and a number.{" "}
          <Link to="/forgot-password" className="text-[#0d9488] font-medium hover:underline">
            Forgot your current password?
          </Link>
        </p>
        {!mustChangeOnly && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        {pwErr && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{pwErr}</div>}
        {pwOk && <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">{pwOk}</div>}
        <button
          type="submit"
          disabled={pwSaving || (!mustChangeOnly && !currentPassword.trim())}
          className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-60"
        >
          {pwSaving ? "Updating…" : "Update password"}
        </button>
      </form>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Booking history</h2>
          <Link to="/patient/book" className="text-sm text-[#0d9488] font-medium hover:underline">
            New booking
          </Link>
        </div>
        {bookErr && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{bookErr}</div>}
        {bookings.length === 0 ? (
          <div className="p-8 rounded-xl border border-slate-200 bg-white text-center text-slate-500">No bookings yet.</div>
        ) : (
          <div className="space-y-2">
            {bookings.map((a) => (
              <Link
                key={a._id}
                to={`/patient/bookings/${a._id}`}
                className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0d9488]/40 transition"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900">{a.doctorNameSnapshot || "—"}</div>
                    <div className="text-sm text-slate-600">{new Date(a.startTime).toLocaleString()}</div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      a.status === "Cancelled"
                        ? "bg-red-50 text-red-800"
                        : a.status === "Completed"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
