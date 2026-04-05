import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../../api/client.js";
import Logo from "../../components/Logo.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await apiPost("/api/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f6f3]">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-[#64748b] hover:text-[#0d9488] mb-8 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <Logo className="h-12 w-12" showText={false} />
            <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
          </div>

          {done ? (
            <div className="space-y-4">
              <p className="text-slate-700 text-sm">Submitted.</p>
              <Link to="/login" className="block w-full text-center py-3 rounded-lg bg-[#0d9488] text-white font-semibold hover:bg-[#0f766e]">
                Back
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488] focus:border-transparent"
                />
              </div>
              {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
              <button type="submit" className="w-full py-3 rounded-lg bg-[#0d9488] text-white font-semibold hover:bg-[#0f766e]">
                Submit
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
