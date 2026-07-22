import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { getProfileApi } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_GUEST_USER: User = {
  id: "guest-user-id",
  name: "Guest User",
  email: "guest@local.user",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_GUEST_USER);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token") || "guest-token");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        setUser(DEFAULT_GUEST_USER);
        setLoading(false);
        return;
      }
      try {
        const profile = await getProfileApi();
        setUser(profile);
      } catch (err) {
        setUser(DEFAULT_GUEST_USER);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("guest-token");
    setUser(DEFAULT_GUEST_USER);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
