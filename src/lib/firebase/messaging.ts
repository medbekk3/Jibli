"use client";

import type { MessagePayload } from "firebase/messaging";
import { requireFirebaseApp } from "./config";

export type PushRegistrationResult = { token: string; registration: ServiceWorkerRegistration };

export function isPushSupported() {
  return typeof window !== "undefined" && window.isSecureContext && "serviceWorker" in navigator && "Notification" in window && "PushManager" in window;
}

export async function requestPushPermission() {
  if (!isPushSupported()) return "unsupported" as const;
  if (Notification.permission === "denied") return "denied" as const;
  return Notification.requestPermission();
}

function serviceWorkerUrl() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const params = new URLSearchParams();
  Object.entries(config).forEach(([key, value]) => { if (value) params.set(key, value); });
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

async function serviceWorkerRegistration() {
  return navigator.serviceWorker.register(serviceWorkerUrl(), { scope: "/" });
}

export async function getPushRegistrationToken(): Promise<PushRegistrationResult> {
  if (!isPushSupported()) throw new Error("PUSH_UNSUPPORTED");
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) throw new Error("PUSH_NOT_CONFIGURED");
  const [{ getMessaging, getToken, isSupported }, registration] = await Promise.all([import("firebase/messaging"), serviceWorkerRegistration()]);
  if (!(await isSupported())) throw new Error("PUSH_UNSUPPORTED");
  const token = await getToken(getMessaging(requireFirebaseApp()), { vapidKey, serviceWorkerRegistration: registration });
  if (!token) throw new Error("PUSH_TOKEN_UNAVAILABLE");
  return { token, registration };
}

async function authorizationHeader() {
  const { getFirebaseAuth } = await import("./auth");
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("PUSH_AUTH_REQUIRED");
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

export async function registerPushNotifications() {
  const permission = await requestPushPermission();
  if (permission !== "granted") return { permission } as const;
  const { token, registration } = await getPushRegistrationToken();
  const response = await fetch("/api/push/register", { method: "POST", headers: { "Content-Type": "application/json", ...(await authorizationHeader()) }, body: JSON.stringify({ token, platform: "web" }) });
  if (!response.ok) throw new Error("PUSH_REGISTER_FAILED");
  localStorage.setItem("jibli_push_enabled", "true");
  return { permission, registration } as const;
}

export async function deleteCurrentPushToken() {
  if (!isPushSupported()) return;
  try {
    const { token } = await getPushRegistrationToken();
    await fetch("/api/push/unregister", { method: "DELETE", headers: { "Content-Type": "application/json", ...(await authorizationHeader()) }, body: JSON.stringify({ token }) });
    const { deleteToken, getMessaging } = await import("firebase/messaging");
    await deleteToken(getMessaging(requireFirebaseApp()));
  } finally {
    localStorage.removeItem("jibli_push_enabled");
  }
}

export async function subscribeForegroundMessages(callback: (payload: MessagePayload) => void) {
  if (!isPushSupported()) return () => undefined;
  const { getMessaging, isSupported, onMessage } = await import("firebase/messaging");
  if (!(await isSupported())) return () => undefined;
  return onMessage(getMessaging(requireFirebaseApp()), callback);
}

export async function pushApiRequest(path: string, init?: RequestInit) {
  return fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(await authorizationHeader()), ...(init?.headers ?? {}) } });
}