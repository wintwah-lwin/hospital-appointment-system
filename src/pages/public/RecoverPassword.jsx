import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import Logo from "../../components/Logo.jsx";

/** Dedupe React Strict Mode double-mount: one HTTP consume per token per page load */
let recoveryPromiseByToken = new Map();

export default function RecoverPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { recoverWithToken } = useAuth();
  const [error, setError] = useState("");
  const [working, setWorking] = useState(true);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Invalid link.");
      setWorking(false);
      return;
    }
    if (!recoveryPromiseByToken.has(token)) {
      recoveryPromiseByToken.set(
        token,
        recoverWithToken(token).finally(() => {
          /* keep resolved promise so StrictMode remount reuses it */
        })
      );
    }
    recoveryPromiseByToken
      .get(token)
      .then(() => navigate("/patient/set-password", { replace: true }))
      .catch((e) => setError(String(e?.message || e)))
      .finally(() => setWorking(false));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f6f3]">
      <div className="w-full max-w-md text-center">
        <Logo className="h-14 w-14 mx-auto mb-4" showText={false} />
        {working && <p className="text-slate-600 text-sm">…</p>}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-700 text-sm text-left">
            {error}
            <Link to="/login" className="block mt-4 text-center text-[#0d9488] font-medium">
              Back
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
