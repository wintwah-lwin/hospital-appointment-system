import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiPatch } from "../../api/client.js";
import { useAuth } from "../../auth/AuthContext.jsx";

export default function SetNewPassword() {
  const { refreshMe } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (pw !== pw2) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await apiPatch("/api/auth/password", { newPassword: pw });
      await refreshMe();
      setOk(true);
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  if (ok) {
    return (
      <div className="max-w-md mx-auto p-8 rounded-2xl border border-slate-200 bg-white text-center space-y-4">
        <h1 className="text-xl font-bold text-slate-900">Done</h1>
        <Link to="/patient" className="inline-block px-5 py-2.5 rounded-lg bg-[#0d9488] text-white font-medium">
          Continue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">New password</h1>
      <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl border border-slate-200 bg-white">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#0d9488]"
          />
        </div>
        {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
        <button type="submit" className="w-full py-3 rounded-lg bg-[#0d9488] text-white font-semibold hover:bg-[#0f766e]">
          Save password
        </button>
      </form>
    </div>
  );
}
