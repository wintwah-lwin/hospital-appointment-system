import React, { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/client.js";

// login state for whole app
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const token = localStorage.getItem("ic_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiGet("/api/auth/me");
      setUser(data.user || null);
    } catch {
      localStorage.removeItem("ic_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
  }, []);

  async function login(credentials) {
    const data = await apiPost("/api/auth/login", credentials);
    localStorage.setItem("ic_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function registerPatient(body) {
    const data = await apiPost("/api/auth/register", body);
    localStorage.setItem("ic_token", data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("ic_token");
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, registerPatient, logout, refreshMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
