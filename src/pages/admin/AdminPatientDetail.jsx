import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../../api/client.js";
import { Link, useParams, useNavigate } from "react-router-dom";

export default function AdminPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banning, setBanning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet(`/api/users/patients/${id}`);
      setPatient(data);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function toggleBan() {
    if (!patient) return;
    const action = patient.isBanned ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} this patient?`)) return;
    setBanning(true);
    try {
      await apiPost(`/api/users/patients/${id}/${action}`);
      await load();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setBanning(false);
    }
  }

  async function handleDelete() {
    if (!patient) return;
    if (!window.confirm(`Permanently delete this patient and all their appointments? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/users/patients/${id}`);
      navigate("/admin/patients");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">Loading…</div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link to="/admin/patients" className="text-sm font-medium text-[#0d9488] hover:underline">← Back to patients</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error || "Patient not found."}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/patients" className="text-sm font-medium text-[#0d9488] hover:underline">← Back to patients</Link>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">{patient.displayName || patient.email || "Patient"}</h2>
          <div className="flex items-center gap-2">
            {patient.isBanned && (
              <span className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-sm font-medium">Banned</span>
            )}
            <button
              type="button"
              onClick={toggleBan}
              disabled={banning}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                patient.isBanned
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              } disabled:opacity-50`}
            >
              {banning ? "…" : patient.isBanned ? "Unban" : "Ban"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50 transition"
            >
              {deleting ? "…" : "Delete"}
            </button>
          </div>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase">Email</dt>
            <dd className="text-zinc-900 mt-0.5">{patient.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase">Display name</dt>
            <dd className="text-zinc-900 mt-0.5">{patient.displayName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase">Date of birth</dt>
            <dd className="text-zinc-900 mt-0.5">{patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 uppercase">Registered</dt>
            <dd className="text-zinc-900 mt-0.5">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "—"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
