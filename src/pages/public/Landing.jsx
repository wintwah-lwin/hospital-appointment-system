import { Link } from "react-router-dom";
import Logo from "../../components/Logo.jsx";

export default function Landing() {
  return (
    <div className="bg-[#f8f6f3] text-[#1e293b]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#faf9f7]/95 backdrop-blur border-b border-[#e8e4de]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo className="h-11 w-11" />
          <nav className="flex items-center gap-8">
            <Link to="/status" className="text-sm text-[#64748b] hover:text-[#0d9488] transition">Status</Link>
            <Link to="/login" className="text-sm font-medium text-[#0d9488] hover:text-[#0f766e] transition">Sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 relative overflow-hidden">
        {/* Floating medical accents */}
        <div className="absolute top-20 right-10 w-16 h-16 rounded-full bg-[#0d9488]/10 animate-float pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-8 h-8 rounded-full bg-[#0d9488]/15 animate-float pointer-events-none" style={{ animationDelay: "1s" }} />
        <div className="absolute top-32 right-1/3 w-12 h-12 rounded-full border-2 border-[#0d9488]/20 animate-pulse-soft pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="max-w-2xl relative">
          <p className="text-[#0d9488] font-medium text-sm tracking-wide mb-4">Appointment booking for Singapore healthcare</p>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#0f172a] leading-[1.15]">
            Skip the queue.
            <br />
            <span className="text-[#0d9488]">Book in seconds.</span>
          </h1>

          {/* Animated ECG / heartbeat line */}
          <div className="mt-8 w-full max-w-sm">
            <svg viewBox="0 0 280 70" className="w-full h-14" aria-hidden>
              <defs>
                <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="#0d9488" stopOpacity="1" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <path
                d="M0 35 L20 35 L30 20 L40 35 L50 35 L60 50 L70 35 L80 35 L90 25 L100 35 L130 35 L140 15 L150 35 L160 35 L170 45 L180 35 L210 35 L220 20 L230 35 L240 35 L250 40 L260 35 L280 35"
                fill="none"
                stroke="url(#ecg-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="280 280"
                className="animate-heartbeat-line"
              />
            </svg>
          </div>

          <p className="mt-6 text-lg text-[#475569] leading-relaxed max-w-lg">
            Pick your doctor, choose a time slot, and walk in with a queue number. No more waiting rooms before you&apos;re even seen.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-[#0d9488] text-white font-medium rounded-lg hover:bg-[#0f766e] transition shadow-sm shadow-teal-900/10"
          >
            Get started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </section>

      {/* Feature blocks */}
      <section className="bg-white border-y border-[#e8e4de] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 md:gap-10 items-start">
            <div className="min-w-0 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center font-bold text-lg mb-4">1</div>
              <h3 className="font-semibold text-[#0f172a] text-lg">Book online</h3>
              <p className="mt-2 text-[#64748b] text-sm leading-relaxed min-h-[2.75rem]">Select specialty, doctor, and date. Click an available slot. Done.</p>
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center font-bold text-lg mb-4">2</div>
              <h3 className="font-semibold text-[#0f172a] text-lg">Check in at clinic</h3>
              <p className="mt-2 text-[#64748b] text-sm leading-relaxed min-h-[2.75rem]">Use the kiosk or counter with your email to get your token number.</p>
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center font-bold text-lg mb-4">3</div>
              <h3 className="font-semibold text-[#0f172a] text-lg">Wait & consult</h3>
              <p className="mt-2 text-[#64748b] text-sm leading-relaxed min-h-[2.75rem]">Relax in the waiting area until your number is called.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="aspect-square max-w-md rounded-2xl bg-[#0f172a] flex items-center justify-center overflow-hidden relative">
              {/* Big moving medical circles — pulse rings (heartbeat/vital monitor) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="absolute w-64 h-64 rounded-full border-2 border-[#0d9488]/40 animate-pulse-ring" style={{ animationDelay: "0s" }} />
                <div className="absolute w-64 h-64 rounded-full border-2 border-[#0d9488]/30 animate-pulse-ring" style={{ animationDelay: "0.6s" }} />
                <div className="absolute w-64 h-64 rounded-full border-2 border-[#0d9488]/25 animate-pulse-ring" style={{ animationDelay: "1.2s" }} />
              </div>
              {/* Rotating medical cross ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-[320px] h-[320px] animate-rotate-slow text-[#0d9488]/30" viewBox="0 0 100 100" aria-hidden>
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="8 4" />
                  <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                  <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
                </svg>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 rounded-full bg-[#0d9488]/5" />
              </div>
              <div className="relative text-center p-8 flex flex-col items-center justify-center z-10">
                <img src="/intellicare-logo.png" alt="IntelliCare" className="h-32 w-32 object-contain opacity-80" />
                <p className="text-[#94a3b8] text-sm mt-4">Healthcare simplified</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] leading-tight">
              One platform for your whole visit
            </h2>
            <p className="mt-4 text-[#475569] leading-relaxed">
              From booking to queue management, IntelliCare connects patients, staff, and doctors in a single system. No paper slips, no confusion.
            </p>
            <ul className="mt-6 space-y-3 text-[#475569]">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]" /> Patients book with email</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]" /> Staff and admin use email</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0d9488]" /> No credit card required</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Dark CTA stripe */}
      <section className="bg-[#0f172a] py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-3 text-slate-400 max-w-xl mx-auto">Join patients who&apos;ve already simplified their clinic visits.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mt-8 px-8 py-3.5 bg-[#0d9488] text-white font-semibold rounded-lg hover:bg-[#0f766e] transition"
          >
            Sign in
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-wrap justify-between gap-8 items-center border-t border-[#e2e8f0] pt-12">
          <div className="flex items-center gap-2">
            <img src="/intellicare-logo.png" alt="IntelliCare" className="h-6 w-6 object-contain" />
            <span className="font-semibold text-[#0f172a]">IntelliCare</span>
            <span className="text-[#94a3b8] mx-2">·</span>
            <span className="text-[#64748b] text-sm">Resource Allocation</span>
          </div>
          <div className="flex gap-6 text-sm text-[#64748b]">
            <Link to="/status" className="hover:text-[#0d9488]">Status</Link>
            <Link to="/login" className="hover:text-[#0d9488]">Sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
