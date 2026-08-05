"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { createAccount, getFirebaseAuth, loginWithEmail, logoutFromFirebase, sendResetEmail } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { createCustomerProfile, getUserProfile } from "@/lib/firebase/firestore";
import type { AccountStatus, SignUpData, UserProfile, UserRole } from "@/types/auth";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    return onAuthStateChanged(getFirebaseAuth(), async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setProfile(await getUserProfile(currentUser.uid));
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await loginWithEmail(email.trim(), password);
    const userProfile = await getUserProfile(credential.user.uid);

    if (!userProfile) {
      await logoutFromFirebase();
      throw new Error("تعذر العثور على بيانات الحساب. تواصل مع الإدارة.");
    }

    if (userProfile.role === "admin" && userProfile.status === "active") {
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: unknown; error?: { message?: unknown } } | null;
        const serverMessage = typeof payload?.error?.message === "string" ? payload.error.message : typeof payload?.message === "string" ? payload.message : "";
        await fetch("/api/auth/session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
        await logoutFromFirebase().catch(() => undefined);
        setUser(null);
        setProfile(null);
        if (serverMessage) throw new Error(serverMessage);
        if (response.status === 400) throw new Error("بيانات جلسة الإدارة غير مكتملة.");
        if (response.status === 401) throw new Error("انتهت صلاحية جلسة الدخول، أعد تسجيل الدخول.");
        if (response.status === 403) throw new Error("هذا الحساب لا يملك صلاحية الإدارة.");
        throw new Error("تعذر إعداد جلسة الإدارة على الخادم.");
      }
    }
    if (userProfile.role === "restaurant") {
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth/restaurant-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: unknown; error?: { message?: unknown } } | null;
        await fetch("/api/auth/restaurant-session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
        await logoutFromFirebase().catch(() => undefined);
        setUser(null); setProfile(null);
        throw new Error(typeof payload?.error?.message === "string" ? payload.error.message : typeof payload?.message === "string" ? payload.message : "تعذر إنشاء جلسة المطعم الآمنة.");
      }
    }
    setUser(credential.user);
    setProfile(userProfile);
    return userProfile;
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    const credential = await createAccount(data.email.trim(), data.password);
    try {
      await createCustomerProfile(credential.user.uid, data);
      const createdProfile = await getUserProfile(credential.user.uid);
      setUser(credential.user);
      setProfile(createdProfile);
    } catch (error) {
      await logoutFromFirebase();
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await import("@/lib/firebase/messaging").then(({ deleteCurrentPushToken }) => deleteCurrentPushToken()).catch(() => undefined);
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
    await fetch("/api/auth/restaurant-session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
    await logoutFromFirebase();
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendResetEmail(email.trim());
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [loading, profile, resetPassword, signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("يجب استعمال حالة المصادقة داخل مزود المصادقة.");
  return context;
}
