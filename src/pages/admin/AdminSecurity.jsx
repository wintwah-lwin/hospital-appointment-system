import React, { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../../api/client.js";

export default function AdminSecurity() {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("events");
  const [filter, setFilter] = useState({ role: "", success: "" });

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [sumRes, eventsRes, alertsRes] = await Promise.all([
        apiGet("/api/security/summary"),
        apiGet("/api/security/login-events?limit=100"),
        apiGet("/api/security/alerts?limit=50")
      ]);
      setSummary(sumRes);
      setEvents(eventsRes.events || []);
      setAlerts(alertsRes.alerts || []);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filter.role && e.role !== filter.role) return false;
    if (filter.success !== "" && String(e.success) !== filter.success) return false;
    return true;
  });

  async function deleteEvent(id) {
    if (!window.confirm("Delete this login event?")) return;
    try {
      await apiDelete(`/api/security/login-events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (e) {
      setError(String(e?.message || e));
    }
  }

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Security & Login Audit</h1>
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Security & Login Audit</h1>
          <p className="text-sm text-zinc-500 mt-1">Monitor who logged in, failed attempts, and security alerts.</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
        >
          Refresh
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Logins (24h)</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{summary.last24h?.totalLogins ?? 0}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Failed (24h)</div>
            <div className="text-2xl font-semibold text-amber-600 mt-1">{summary.last24h?.failedLogins ?? 0}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Unique users (24h)</div>
            <div className="text-2xl font-semibold text-zinc-900 mt-1">{summary.last24h?.uniqueUsers ?? 0}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Alerts (7d)</div>
            <div className="text-2xl font-semibold text-red-600 mt-1">{summary.alertsLast7Days ?? 0}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200">
        <button
          onClick={() => setTab("events")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
            tab === "events" ? "bg-white border border-zinc-200 border-b-0 -mb-px text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Login events
        </button>
        <button
          onClick={() => setTab("alerts")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
            tab === "alerts" ? "bg-white border border-zinc-200 border-b-0 -mb-px text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Security alerts
        </button>
      </div>

      {tab === "events" && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-100 flex flex-wrap gap-3">
            <select
              value={filter.role}
              onChange={(e) => setFilter((f) => ({ ...f, role: e.target.value }))}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm"
            >
              <option value="">All roles</option>
              <option value="patient">Patient</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filter.success}
              onChange={(e) => setFilter((f) => ({ ...f, success: e.target.value }))}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm"
            >
              <option value="">All</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Time</th>
                  <th className="text-left font-medium px-4 py-3">User</th>
                  <th className="text-left font-medium px-4 py-3">Role</th>
                  <th className="text-left font-medium px-4 py-3">Status</th>
                  <th className="text-left font-medium px-4 py-3">IP</th>
                  <th className="text-left font-medium px-4 py-3">Risk</th>
                  <th className="text-left font-medium px-4 py-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-zinc-500 text-center">
                      No login events yet.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((e) => (
                    <tr key={e._id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 text-zinc-600">
                        {new Date(e.createdAt).toLocaleString("en-SG")}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {e.displayName || e.identifier || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 capitalize">{e.role || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            e.success ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {e.success ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">{e.ip || "—"}</td>
                      <td className="px-4 py-3">
                        {e.riskScore > 0 ? (
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              e.riskScore >= 70 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {e.riskScore}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deleteEvent(e._id)}
                          className="px-2 py-1 rounded-lg border border-zinc-200 text-zinc-600 text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Time</th>
                  <th className="text-left font-medium px-4 py-3">User</th>
                  <th className="text-left font-medium px-4 py-3">Type</th>
                  <th className="text-left font-medium px-4 py-3">Severity</th>
                  <th className="text-left font-medium px-4 py-3">Message</th>
                  <th className="text-left font-medium px-4 py-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-zinc-500 text-center">
                      No security alerts yet.
                    </td>
                  </tr>
                ) : (
                  alerts.map((a) => (
                    <tr key={a._id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 text-zinc-600">
                        {new Date(a.createdAt).toLocaleString("en-SG")}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {a.displayName || a.identifier || "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{a.alertType?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            a.severity === "critical"
                              ? "bg-red-600 text-white"
                              : a.severity === "high"
                                ? "bg-red-100 text-red-700"
                                : a.severity === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{a.message || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600">{a.ip || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
