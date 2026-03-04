import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm font-medium transition ${
          isActive
            ? "bg-zinc-900 text-white"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-md">
              IC
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-zinc-900">IntelliCare</div>
              <div className="text-xs text-zinc-500">Resource Allocation</div>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            <NavItem to={user?.role === "admin" ? "/admin" : user?.role === "staff" ? "/staff" : "/patient"}>
              Home
            </NavItem>
            <NavItem to="/status">Status</NavItem>
            <NavItem to="/departments">Departments</NavItem>
            {user?.role === "admin" && <NavItem to="/admin">Admin</NavItem>}
            <button
              onClick={logout}
              className="ml-2 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-5 text-sm text-zinc-500">
          IntelliCare – Resource Allocation
        </div>
      </footer>
    </div>
  );
}
