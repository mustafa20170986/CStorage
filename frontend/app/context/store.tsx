"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  email: string;
  sub?: string;
}
interface AuthcontextType {
  user: User;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthcontextType | null>(null);

export default function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    //load saved session
    const savedToken = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user_data");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // handle login
  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch("http://localhost:1017/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: pass,
        }),
      });
      if (!res.ok) {
        throw new Error("login filed");
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify(data.user));

      setToken(data.access_token);
      setUser(data.user);
    } catch (error) {
      console.log(error);
    }
  };
  const signup = async (email: string, pass: string) => {
    try {
      const res = await fetch("http://localhost:1017/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password: pass,
        }),
      });
      if (!res.ok) {
        throw new Error("signup failed");
      }
      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      localStorage.setItem("user_data", JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      router.push("/upload");
    } catch (error) {
      console.log(error);
    }
  };
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    setToken(null);
    setUser(null);
    router.push("/");
  };
  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!token,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

//export custorm hook like clerk
export const useAuth = () => {
  const contetx = useContext(AuthContext);
  if (!contetx) throw new Error(" Authprovider must be used");
  return contetx;
};
