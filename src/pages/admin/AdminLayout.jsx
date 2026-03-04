import { NavLink, Outlet } from "react-router-dom";

function SideLink({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-4 py-2.5 rounded-xl text-sm font-medium transition block ${
          isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm h-fit sticky top-24">
        <div className="px-2 py-1">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Admin</div>
          <div className="font-semibold text-zinc-900 mt-0.5">Operations Dashboard</div>
        </div>
        <div className="mt-4 grid gap-1">
          <SideLink to="/admin" end>Overview</SideLink>
          <SideLink to="/admin/booking-load">Booking Load</SideLink>
        </div>
      </aside>

      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  );
}
