import React, { useEffect, useState } from "react";
import { apiGet } from "../../api/client.js";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [docs, sched] = await Promise.all([
        apiGet("/api/doctors"),
        apiGet("/api/schedule/doctors")
      ]);
      setDoctors(docs || []);
      setSchedules(sched || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const getSchedule = (doctorId) => schedules.find(s => String(s.doctorId) === String(doctorId));

  const filtered = doctors.filter((d) => {
    const name = (d.name || "").toLowerCase();
    const specialty = (d.specialty || "").toLowerCase();
    const q = search.trim().toLowerCase();
    return !q || name.includes(q) || specialty.includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Doctors</h1>
        <p className="text-sm text-zinc-500 mt-1">Click a doctor to view details.</p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or specialty..."
        className="w-full max-w-md px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
      />

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">Loading…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <button
              key={d._id}
              type="button"
              onClick={() => setSelected(selected?._id === d._id ? null : d)}
              className={`rounded-xl border p-5 text-left transition ${
                selected?._id === d._id
                  ? "border-[#0d9488] bg-[#ccfbf1]/50 ring-2 ring-[#0d9488]/30"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <div className="font-semibold text-zinc-900">{d.name}</div>
              <div className="text-sm text-zinc-500 mt-0.5">{d.specialty || "General"}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${d.isActive !== false ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {d.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
      {!loading && doctors.length > 0 && filtered.length === 0 && (
        <p className="text-zinc-500 text-sm">No doctors match your search.</p>
      )}

      {selected && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">{selected.name}</h2>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-zinc-400 hover:text-zinc-600 p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase">Specialty</dt>
              <dd className="text-zinc-900">{selected.specialty || "General"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase">Status</dt>
              <dd>{selected.isActive !== false ? "Active" : "Inactive"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 uppercase">Room</dt>
              <dd className="text-zinc-900">{selected.room || "—"}</dd>
            </div>
            {selected.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500 uppercase">Notes</dt>
                <dd className="text-zinc-900">{selected.notes}</dd>
              </div>
            )}
          </dl>
          {(() => {
            const sched = getSchedule(selected._id);
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const slotLabel = (t) => t === "09:00" ? "9am" : t === "11:00" ? "11am" : t === "14:00" ? "2pm" : t === "16:00" ? "4pm" : "5pm";
            return sched?.days?.length ? (
              <div className="mt-1 pt-4 border-t border-zinc-100">
                <dt className="text-xs font-medium text-emerald-600 uppercase mb-2">Schedule by day</dt>
                <dd className="text-sm text-zinc-700 space-y-2">
                  {sched.days.map((d) => (
                    <div key={d.dayOfWeek}>
                      <span className="font-medium text-zinc-600">{dayNames[d.dayOfWeek]}:</span>{" "}
                      {d.slots?.map((s) => (
                        <span key={s.time} className="inline-block mr-2 mb-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">
                          {slotLabel(s.time)} {s.room}
                        </span>
                      ))}
                    </div>
                  ))}
                </dd>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
