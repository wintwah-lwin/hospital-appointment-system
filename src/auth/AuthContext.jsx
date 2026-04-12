import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  apiGet,
  apiPost,
  getActiveAuthToken,
  persistAuthTokenForRole,
  clearActiveAuthTokens
} from "../api/client.js";

// login state for whole app
const AuthCtx = createContext(null);

/** Don’t call /me on marketing/auth/kiosk pages (avoids mixing last-used ic_token with the wrong portal). */
const SKIP_SESSION_PATH = /^\/($|login|forgot-password|recover-password|kiosk)/;

export function AuthProvider({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    if (SKIP_SESSION_PATH.test(location.pathname)) {
      setUser(null);
      setLoading(false);
      return;
    }
    const token = getActiveAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiGet("/api/auth/me");
      setUser(data.user || null);
    } catch {
      clearActiveAuthTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshMe();
  }, [location.pathname]);

  async function login(credentials) {
    const data = await apiPost("/api/auth/login", credentials);
    persistAuthTokenForRole(data.user?.role, data.token);
    setUser(data.user);
    return data.user;
  }

  async function registerPatient(body) {
    const data = await apiPost("/api/auth/register", body);
    persistAuthTokenForRole(data.user?.role, data.token);
    setUser(data.user);
    return data.user;
  }

  async function recoverWithToken(token) {
    const data = await apiPost("/api/auth/recover-session", { token });
    persistAuthTokenForRole(data.user?.role, data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearActiveAuthTokens();
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, registerPatient, recoverWithToken, logout, refreshMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
