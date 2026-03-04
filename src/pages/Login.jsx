import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { login, registerPatient } = useAuth();
  const nav = useNavigate();

  const [mode, setMode] = useState("login");
  const [patientMode, setPatientMode] = useState(true); // true = patient (NRIC), false = staff/admin (email)

  const [nric, setNric] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const user = mode === "register"
        ? await registerPatient({ nric, dob, password, displayName, email })
        : patientMode
          ? await login({ nric, dob, password })
          : await login({ email, password });

      if (user?.role === "admin") nav("/admin", { replace: true });
      else if (user?.role === "staff") nav("/staff", { replace: true });
      else nav("/patient", { replace: true });
    } catch (err) {
      setError(String(err?.message || err));
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#0b0c10" }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#111217", border: "1px solid #23242a", borderRadius: 16, padding: 24, color: "#e9e9ee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>IntelliCare · Singapore</div>
            <h1 style={{ fontSize: 20, margin: 0 }}>{mode === "register" ? "Patient Registration" : "Login"}</h1>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0 0" }}>Patients: NRIC + password · Staff/Admin: Email + password</p>
          </div>
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ background: "transparent", color: "#cfcfe6", border: "1px solid #2a2b34", borderRadius: 10, padding: "8px 10px", cursor: "pointer" }}
          >
            {mode === "login" ? "Register" : "Back to Login"}
          </button>
        </div>

        {mode === "login" && (
          <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => { setPatientMode(true); setError(""); }}
              style={{ flex: 1, padding: 8, borderRadius: 10, border: patientMode ? "1px solid #4a9eff" : "1px solid #2a2b34", background: patientMode ? "#1a2a40" : "transparent", color: "#e9e9ee", cursor: "pointer" }}
            >
              Patient (NRIC)
            </button>
            <button
              type="button"
              onClick={() => { setPatientMode(false); setError(""); }}
              style={{ flex: 1, padding: 8, borderRadius: 10, border: !patientMode ? "1px solid #4a9eff" : "1px solid #2a2b34", background: !patientMode ? "#1a2a40" : "transparent", color: "#e9e9ee", cursor: "pointer" }}
            >
              Staff / Admin (Email)
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          {mode === "register" && (
            <>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>NRIC / FIN</span>
                <input value={nric} onChange={(e) => setNric(e.target.value)} placeholder="S1234567D" style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Date of Birth</span>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Display name</span>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Email (optional, for notifications)</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
              </label>
            </>
          )}

          {mode === "login" && patientMode && (
            <>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>NRIC / FIN</span>
                <input value={nric} onChange={(e) => setNric(e.target.value)} placeholder="S1234567D" style={inputStyle} />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Date of Birth (optional verification)</span>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
              </label>
            </>
          )}

          {mode === "login" && !patientMode && (
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.8 }}>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@hospital.sg" style={inputStyle} />
            </label>
          )}

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </label>

          {error && <div style={{ color: "#ff8b8b", fontSize: 12 }}>{error}</div>}

          <button type="submit" style={primaryBtn}>
            {mode === "register" ? "Create account" : "Login"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>
            Switch to <strong>Patient (NRIC)</strong> or <strong>Staff/Admin (Email)</strong> above. Patients register with NRIC, DOB, and password.
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #2a2b34",
  background: "#0f1015",
  color: "#e9e9ee",
  outline: "none"
};

const primaryBtn = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #2a2b34",
  background: "#1b1d27",
  color: "#e9e9ee",
  cursor: "pointer",
  fontWeight: 600
};
