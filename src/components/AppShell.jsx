import { Link, NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function AppShell() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <NavLink
            to="/departments"
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`
            }
          >
            Departments
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
          {/* Mobile: hamburger + title area */}
          <div className="flex items-center gap-3 mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 shrink-0" showText={false} asLink={false} />
              <span className="font-semibold text-slate-900 text-sm">IntelliCare</span>
            </Link>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
