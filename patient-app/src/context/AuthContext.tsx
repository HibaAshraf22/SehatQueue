
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/constants/api";

type PatientUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: PatientUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PatientUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync("patientToken");
        const savedUser = await SecureStore.getItemAsync("patientUser");

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log("Session loading failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (data.user?.role !== "patient") {
      throw new Error("Only patient accounts can access this app");
    }

    await SecureStore.setItemAsync("patientToken", data.token);
    await SecureStore.setItemAsync(
      "patientUser",
      JSON.stringify(data.user)
    );

    setToken(data.token);
    setUser(data.user);
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    await login(email, password);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("patientToken");
    await SecureStore.deleteItemAsync("patientUser");

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
