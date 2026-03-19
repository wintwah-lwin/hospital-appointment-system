import { Link, NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "./Logo.jsx";
import { apiGet, apiPost } from "../api/client.js";

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet("/api/notifications");
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function markAllRead() {
    try {
      await apiPost("/api/notifications/read-all", {});
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }

  const unread = items.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 transition"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-teal-500 text-white text-xs font-medium flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-semibold text-slate-900 text-sm">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-teal-600 hover:underline">Mark all read</button>
              )}
            </div>
            <div className="overflow-y-auto max-h-64">
              {loading ? (
                <div className="p-6 text-center text-slate-500 text-sm">Loading…</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No notifications yet.</div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {items.map(n => (
                    <li key={n._id} className={`px-4 py-3 text-sm ${n.isRead ? "text-slate-600 bg-white" : "text-slate-900 bg-teal-50/30"}`}>
                      <div className="flex gap-2">
                        {(n.type === "REMINDER_12H" || n.type === "REMINDER_3H") && (
                          <span className="shrink-0 w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </span>
                        )}
                        <p>{n.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (user?.role === "patient" && user?.isBanned) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-zinc-900/90 z-[9999]">
        <div className="mx-4 max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Account suspended</h2>
          <p className="text-zinc-600 mb-6">You can&apos;t use this service because you are banned. Please contact support.</p>
          <button onClick={logout} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
      {/* Sidebar nav - left; drawer on mobile, fixed on desktop */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Link to="/" className="block p-4 border-b border-slate-200 hover:bg-slate-50/50 transition">
          <div className="flex items-center gap-2">
            <Logo className="h-11 w-11 shrink-0" showText={false} asLink={false} />
            <div>
              <div className="font-semibold text-slate-900 text-sm">IntelliCare</div>
              <div className="text-xs text-slate-500">Resource Allocation</div>
            </div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1" onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}>
          <NavLink
            to={user?.role === "admin" ? "/admin" : user?.role === "staff" ? "/staff" : "/patient"}
            end
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`
            }
          >
            {user?.role === "admin" ? "Overview" : "Home"}
          </NavLink>
          {user?.role === "admin" && (
            <>
              <NavLink
                to="/admin/booking-load"
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`
                }
              >
                Booking Load
              </NavLink>
              <NavLink
                to="/admin/security"
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`
                }
              >
                Security
              </NavLink>
              <NavLink
                to="/admin/doctors"
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`
                }
              >
                Doctors
              </NavLink>
              <NavLink
                to="/admin/patients"
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`
                }
              >
                Patients
              </NavLink>
            </>
          )}
          <NavLink
            to="/status"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`
            }
          >
            Status
          </NavLink>
        </nav>
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50 min-w-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Top bar: hamburger (mobile) + logo (mobile) + notification bell (top-right) */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100 lg:hidden"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="flex items-center gap-2 lg:hidden">
                <Logo className="h-8 w-8 shrink-0" showText={false} asLink={false} />
                <span className="font-semibold text-slate-900 text-sm">IntelliCare</span>
              </Link>
            </div>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
