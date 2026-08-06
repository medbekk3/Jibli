"use client";

import type { MessagePayload } from "firebase/messaging";
import { BellRing, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useNotifications } from "@/features/notifications/notification-context";
import { registerPushNotifications, subscribeForegroundMessages } from "@/lib/firebase/messaging";

type Toast = { title: string; body: string; url: string; restaurant: boolean } | null;
type PushContextValue = { primeAudio: () => void };
const PushContext = createContext<PushContextValue>({ primeAudio: () => undefined });
const handledEvents = new Set<string>();
let audioReady = false;

function eventKey(payload: MessagePayload) {
  const data = payload.data ?? {};
  return payload.messageId || `${data.type ?? "unknown"}:${data.orderId ?? ""}:${data.status ?? ""}:${data.orderNumber ?? ""}`;
}

function isDuplicate(payload: MessagePayload) {
  const key = eventKey(payload);
  if (handledEvents.has(key)) return true;
  handledEvents.add(key);
  if (handledEvents.size > 200) handledEvents.delete(handledEvents.values().next().value ?? "");
  return false;
}

function fallbackSound(restaurant: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = restaurant ? 880 : 620;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(restaurant ? 0.12 : 0.06, context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(); oscillator.stop(context.currentTime + 0.22);
    window.setTimeout(() => void context.close(), 400);
  } catch { /* Audio is optional. */ }
}

function playSound(restaurant: boolean) {
  if (!audioReady || localStorageSafe("jibli_notification_sound_muted") === "true") return;
  const audio = new Audio(restaurant ? "/sounds/new-order.mp3" : "/sounds/order-update.mp3");
  audio.preload = "auto";
  audio.volume = restaurant ? 0.9 : 0.55;
  void audio.play().catch(() => fallbackSound(restaurant));
}

function statusTitle(status: string | undefined, fallback: string) {
  const titles: Record<string, string> = {
    accepted: "\u062a\u0645 \u0642\u0628\u0648\u0644 \u0627\u0644\u0637\u0644\u0628",
    preparing: "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0636\u064a\u0631",
    out_for_delivery: "\u062e\u0631\u062c \u0644\u0644\u062a\u0648\u0635\u064a\u0644",
    delivered: "\u062a\u0645 \u0627\u0644\u062a\u0633\u0644\u064a\u0645",
    rejected: "\u062a\u0645 \u0627\u0644\u0631\u0641\u0636",
    cancelled: "\u062a\u0645 \u0627\u0644\u0625\u0644\u063a\u0627\u0621",
  };
  return status ? titles[status] ?? fallback : fallback;
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { user, status, role } = useAuth();
  const { refresh } = useNotifications();
  const [toast, setToast] = useState<Toast>(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setPushEnabled(localStorageSafe("jibli_push_enabled") === "true");
    sync(); window.addEventListener("jibli:push-setting-changed", sync);
    return () => window.removeEventListener("jibli:push-setting-changed", sync);
  }, []);

  const enabled = Boolean(user && status === "active" && pushEnabled);
  useEffect(() => {
    if (!enabled || Notification.permission !== "granted") return;
    void registerPushNotifications().catch(() => undefined);
  }, [enabled, user?.uid]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false; let unsubscribe: () => void = () => undefined;
    void subscribeForegroundMessages((payload) => {
      if (isDuplicate(payload)) return;
      const data = payload.data ?? {};
      const restaurant = data.type === "new_order";
      const fallbackTitle = payload.notification?.title || (restaurant ? "\u0637\u0644\u0628 \u062c\u062f\u064a\u062f" : "\u062a\u062d\u062f\u064a\u062b \u0637\u0644\u0628\u0643");
      setToast({
        title: restaurant ? "\u0637\u0644\u0628 \u062c\u062f\u064a\u062f" : statusTitle(data.status, fallbackTitle),
        body: payload.notification?.body ?? "",
        url: typeof data.url === "string" && data.url.startsWith("/") && !data.url.startsWith("//") ? data.url : role === "restaurant" ? "/restaurant-dashboard/orders" : "/orders",
        restaurant,
      });
      playSound(restaurant);
      void refresh();
      window.dispatchEvent(new CustomEvent("jibli:push", { detail: data }));
    }).then((cleanup) => { if (cancelled) cleanup(); else unsubscribe = cleanup; }).catch(() => undefined);
    return () => { cancelled = true; unsubscribe(); };
  }, [enabled, refresh, role]);

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 9000); return () => window.clearTimeout(timer); }, [toast]);
  const primeAudio = useCallback(() => {
    audioReady = true;
    const audio = new Audio("/sounds/order-update.mp3");
    audio.muted = true;
    void audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => undefined);
  }, []);
  const value = useMemo(() => ({ primeAudio }), [primeAudio]);

  return <PushContext.Provider value={value}>{children}{toast && <aside role="status" aria-live="assertive" className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-[100] mx-auto max-w-md rounded-3xl border border-orange-100 bg-white p-4 shadow-2xl md:bottom-6"><button type="button" onClick={() => setToast(null)} aria-label="\u0625\u063a\u0644\u0627\u0642" className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-gray-100"><X className="size-4" /></button><div className="flex gap-3 pl-8"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><BellRing className="size-5" /></span><div className="min-w-0"><p className="font-black">{toast.title}</p><p className="mt-1 text-xs leading-6 text-gray-500">{toast.body}</p><Link href={toast.url} onClick={() => setToast(null)} className="mt-3 inline-flex h-9 items-center rounded-xl bg-primary px-4 text-xs font-black text-white">{toast.restaurant ? "\u0639\u0631\u0636 \u0627\u0644\u0637\u0644\u0628" : "\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644"}</Link></div></div></aside>}</PushContext.Provider>;
}

function localStorageSafe(key: string) { try { return typeof window === "undefined" ? null : window.localStorage.getItem(key); } catch { return null; } }
export function usePushNotifications() { return useContext(PushContext); }