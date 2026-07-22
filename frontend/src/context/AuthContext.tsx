import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { getProfileApi, sendOtpApi, verifyOtpApi } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  sendOtp: (email: string) => Promise<{ message: string; devOtpCode?: string }>;
  verifyOtp: (email: string, code: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getProfileApi();
        setUser(profile);
      } catch (err) {
        console.warn("Failed to load user profile:", err);
        localStorage.removeItem("token");
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const sendOtp = async (email: string) => {
    return await sendOtpApi(email);
  };

  const verifyOtp = async (email: string, code: string, name?: string) => {
    const res = await verifyOtpApi(email, code, name);
    localStorage.setItem("token", res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sendOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
