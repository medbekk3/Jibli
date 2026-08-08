"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { createAccount, getFirebaseAuth, initializeFirebaseAuthPersistence, loginWithEmail, logoutFromFirebase, sendResetEmail } from "@/lib/firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { createCustomerProfile, getUserProfile } from "@/lib/firebase/firestore";
import type { AccountStatus, SignUpData, UserProfile, UserRole } from "@/types/auth";

export type AuthState = "AUTH_LOADING" | "AUTHENTICATED" | "UNAUTHENTICATED";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  role: UserRole | null;
  status: AccountStatus | null;
  authState: AuthState;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncRoleSession(user: User, profile: UserProfile, forceTokenRefresh = false) {
  const endpoint = profile.role === "admin"
    ? "/api/auth/session"
    : profile.role === "restaurant"
      ? "/api/auth/restaurant-session"
      : null;

  if (!endpoint) return;

  const idToken = await user.getIdToken(forceTokenRefresh);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: unknown; error?: { message?: unknown } } | null;
    const message = typeof payload?.error?.message === "string"
      ? payload.error.message
      : typeof payload?.message === "string"
        ? payload.message
        : "تعذر استعادة جلسة الحساب على الخادم.";
    throw new Error(message);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authState, setAuthState] = useState<AuthState>(
    isFirebaseConfigured ? "AUTH_LOADING" : "UNAUTHENTICATED",
  );
  const initialAuthEvent = useRef(true);
  const resolution = useRef(0);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    let active = true;
    let unsubscribe: (() => void) | undefined;

    const resolveUser = async (currentUser: User | null) => {
      const currentResolution = ++resolution.current;
      const isInitial = initialAuthEvent.current;

      if (isInitial) setAuthState("AUTH_LOADING");

      if (!currentUser) {
        if (active && currentResolution === resolution.current) {
          setUser(null);
          setProfile(null);
          setAuthState("UNAUTHENTICATED");
          initialAuthEvent.current = false;
        }
        return;
      }

      try {
        const userProfile = await getUserProfile(currentUser.uid);
        if (!userProfile) throw new Error("تعذر العثور على بيانات الحساب.");

        await syncRoleSession(currentUser, userProfile);

        if (!active || currentResolution !== resolution.current) return;
        setUser(currentUser);
        setProfile(userProfile);
        setAuthState("AUTHENTICATED");
      } catch {
        await logoutFromFirebase().catch(() => undefined);
        if (!active || currentResolution !== resolution.current) return;
        setUser(null);
        setProfile(null);
        setAuthState("UNAUTHENTICATED");
      } finally {
        if (active && currentResolution === resolution.current) {
          initialAuthEvent.current = false;
        }
      }
    };

    const start = async () => {
      try {
        await initializeFirebaseAuthPersistence();
        if (!active) return;
        unsubscribe = onIdTokenChanged(getFirebaseAuth(), (currentUser) => {
          void resolveUser(currentUser);
        });
      } catch {
        if (!active) return;
        setUser(null);
        setProfile(null);
        setAuthState("UNAUTHENTICATED");
        initialAuthEvent.current = false;
      }
    };

    void start();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const credential = await loginWithEmail(email.trim(), password);

    try {
      const userProfile = await getUserProfile(credential.user.uid);
      if (!userProfile) throw new Error("تعذر العثور على بيانات الحساب. تواصل مع الإدارة.");

      await syncRoleSession(credential.user, userProfile, true);
      setUser(credential.user);
      setProfile(userProfile);
      setAuthState("AUTHENTICATED");
      return userProfile;
    } catch (error) {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
      await fetch("/api/auth/restaurant-session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
      await logoutFromFirebase().catch(() => undefined);
      setUser(null);
      setProfile(null);
      setAuthState("UNAUTHENTICATED");
      throw error;
    }
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    const credential = await createAccount(data.email.trim(), data.password);
    try {
      await createCustomerProfile(credential.user.uid, data);
      const createdProfile = await getUserProfile(credential.user.uid);
      if (!createdProfile) throw new Error("تعذر إنشاء بيانات الحساب.");
      setUser(credential.user);
      setProfile(createdProfile);
      setAuthState("AUTHENTICATED");
    } catch (error) {
      await logoutFromFirebase();
      setUser(null);
      setProfile(null);
      setAuthState("UNAUTHENTICATED");
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await import("@/lib/firebase/messaging").then(({ deleteCurrentPushToken }) => deleteCurrentPushToken()).catch(() => undefined);
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
    await fetch("/api/auth/restaurant-session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
    try {
      await logoutFromFirebase();
    } finally {
      setUser(null);
      setProfile(null);
      setAuthState("UNAUTHENTICATED");
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendResetEmail(email.trim());
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    role: profile?.role ?? null,
    status: profile?.status ?? null,
    authState,
    loading: authState === "AUTH_LOADING",
    signIn,
    signUp,
    signOut,
    resetPassword,
  }), [authState, profile, resetPassword, signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("يجب استعمال حالة المصادقة داخل مزود المصادقة.");
  return context;
}