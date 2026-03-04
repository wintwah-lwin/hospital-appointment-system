import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <Link to="/" className="text-xl font-bold text-zinc-900 tracking-tight">
          IntelliCare
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/status"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900 transition"
          >
            Status
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-zinc-200 transition"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Tagline */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "#f97316" }}
          />
          <span className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">
            Singapore-Style Appointment Booking
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 tracking-tight leading-tight max-w-3xl">
          Your health deserves more
          <br />
          <span
            className="font-bold"
            style={{ color: "#ea580c" }}
          >
            than long wait times.
          </span>
        </h1>

        {/* Supporting text */}
        <p className="mt-6 max-w-xl text-lg text-zinc-600 leading-relaxed">
          Book appointments in minutes. Choose your doctor and slot, check in at the clinic,
          and get your queue number — all in one place.
        </p>

        {/* CTA button */}
        <Link
          to="/login"
          className="mt-8 px-8 py-3.5 rounded-2xl text-white font-medium text-base hover:opacity-90 transition shadow-sm"
          style={{ backgroundColor: "#64748b" }}
        >
          Get started — it&apos;s free
        </Link>

        {/* Disclaimer */}
        <p className="mt-6 text-sm text-zinc-400">
          No credit card. Patients sign in with NRIC. Staff and admin use email.
        </p>
      </main>

      <footer className="py-6 text-center text-xs text-zinc-400">
        IntelliCare · Resource Allocation
      </footer>
    </div>
  );
}
