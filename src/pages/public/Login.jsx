import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import Logo from "../../components/Logo.jsx";

export default function Login() {
  const { login, registerPatient } = useAuth();
  const nav = useNavigate();

  const [patientMode, setPatientMode] = useState(true);
  const [patientRegister, setPatientRegister] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (patientMode) {
        if (patientRegister) {
          await registerPatient({ email, password, displayName, dob });
          nav("/patient", { replace: true });
        } else {
          await login({ email, password });
          nav("/patient", { replace: true });
        }
      } else {
        const user = await login({ email, password });
        if (user?.role === "admin") nav("/admin", { replace: true });
        else if (user?.role === "staff") nav("/staff", { replace: true });
        else nav("/patient", { replace: true });
      }
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f6f3]">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-[#64748b] hover:text-[#0d9488] mb-8 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Logo className="h-12 w-12" showText={false} />
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {patientMode ? (patientRegister ? "Register" : "Sign in") : "Sign in"}
              </h1>
              <p className="text-sm text-slate-500">IntelliCare</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-1 p-1 rounded-lg bg-slate-100">
              <button
                type="button"
                onClick={() => { setPatientMode(true); setError(""); setPatientRegister(false); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${patientMode ? "bg-white text-[#0d9488] shadow-sm" : "text-slate-600"}`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => { setPatientMode(false); setError(""); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${!patientMode ? "bg-white text-[#0d9488] shadow-sm" : "text-slate-600"}`}
              >
                Staff / Admin
              </button>
            </div>

            {patientMode && (
              <div className="flex gap-1 p-1 rounded-lg bg-slate-50 border border-slate-100">
                <button
                  type="button"
                  onClick={() => { setPatientRegister(true); setError(""); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${patientRegister ? "bg-white text-[#0d9488] shadow-sm border border-slate-200" : "text-slate-600"}`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => { setPatientRegister(false); setError(""); }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${!patientRegister ? "bg-white text-[#0d9488] shadow-sm border border-slate-200" : "text-slate-600"}`}
                >
                  Sign in
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={patientMode ? "you@gmail.com" : "staff@hospital.sg"} required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" />
            </div>
            {patientMode && patientRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" />
                <p className="text-xs text-slate-500 mt-1">Must be 16 or older to register.</p>
              </div>
            )}
            {patientMode && patientRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name (optional)</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent" />
            </div>

            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

            <button type="submit" className="w-full py-3 rounded-lg bg-[#0d9488] text-white font-semibold hover:bg-[#0f766e] transition">
              {patientMode && patientRegister ? "Register" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-xs text-slate-500 text-center">
            Password: min 8 chars, at least one letter and one number.
          </p>
        </div>
      </div>
    </div>
  );
}
