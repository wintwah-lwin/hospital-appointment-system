import React, { useEffect, useState } from "react";
import { apiGet } from "../../api/client.js";
import { Link } from "react-router-dom";

export default function AdminPatients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await apiGet("/api/users/patients");
      setPatients(data || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = patients.filter((p) => {
    const name = (p.displayName || p.email || "Patient").toLowerCase();
    const email = (p.email || "").toLowerCase();
    const q = search.trim().toLowerCase();
    return !q || name.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Patients</h1>
        <p className="text-sm text-zinc-500 mt-1">Click a patient to view their details on a separate page.</p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full max-w-md px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
      />

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">Loading…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p._id}
              to={`/admin/patients/${p._id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 text-left transition hover:border-zinc-300 hover:bg-zinc-50 block"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-zinc-900">{p.displayName || p.email || "Patient"}</div>
                {p.isBanned && <span className="shrink-0 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-medium">Banned</span>}
              </div>
              <div className="text-sm text-zinc-500 mt-0.5">{p.email}</div>
            </Link>
          ))}
        </div>
      )}
      {!loading && patients.length > 0 && filtered.length === 0 && (
        <p className="text-zinc-500 text-sm">No patients match your search.</p>
      )}
    </div>
  );
}
