import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../../api/client.js";

export default function AdminPasswordResets() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [linkModal, setLinkModal] = useState(null);

  async function load() {
    setErr("");
    try {
      const data = await apiGet("/api/users/password-reset-requests");
      setItems(data || []);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    setBusyId(id);
    setErr("");
    try {
      const res = await apiPost(`/api/users/password-reset-requests/${id}/approve`, {});
      const origin = window.location.origin;
      const fullUrl = `${origin}${res.recoverPath}`;
      setLinkModal({ fullUrl, rawToken: res.token, expiresAt: res.expiresAt });
      await load();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Password resets</h1>

      {err && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{err}</div>}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No requests yet.
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row._id} className="text-slate-800">
                  <td className="px-4 py-3">{row.patientEmail}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        row.status === "pending" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "pending" && (
                      <button
                        type="button"
                        disabled={busyId === row._id}
                        onClick={() => approve(row._id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0d9488] text-white text-xs font-medium disabled:opacity-50"
                      >
                        {busyId === row._id ? "…" : "Link"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {linkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-medium text-slate-700">WhatsApp · {linkModal.expiresAt ? new Date(linkModal.expiresAt).toLocaleString() : "—"}</h2>
            <input
              readOnly
              value={linkModal.fullUrl}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono break-all"
              onFocus={(e) => e.target.select()}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(linkModal.fullUrl);
                }}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium"
              >
                Copy URL
              </button>
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
