"use client";

import { BellRing, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useNotifications } from "@/features/notifications/notification-context";
import { subscribeForegroundMessages } from "@/lib/firebase/messaging";

type Toast = { title: string; body: string; url: string; restaurant: boolean } | null;
type PushContextValue = { primeAudio: () => void };
const PushContext = createContext<PushContextValue>({ primeAudio: () => undefined });
let audioReady = false;

function sound(restaurant: boolean) {
  if (!audioReady) return;
  try { const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext; if (!AudioContextClass) return; const context = new AudioContextClass(); const play = (frequency: number, delay: number) => { const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0.0001, context.currentTime + delay); gain.gain.exponentialRampToValueAtTime(restaurant ? 0.13 : 0.07, context.currentTime + delay + 0.01); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.16); oscillator.connect(gain).connect(context.destination); oscillator.start(context.currentTime + delay); oscillator.stop(context.currentTime + delay + 0.18); }; play(restaurant ? 880 : 620, 0); if (restaurant) play(1040, 0.2); window.setTimeout(() => void context.close(), 700); } catch { /* Browser sound restrictions are non-fatal. */ }
}

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { user, status, role } = useAuth(); const { refresh } = useNotifications(); const [toast, setToast] = useState<Toast>(null);
  const enabled = Boolean(user && status === "active" && localStorageSafe() === "true");
  useEffect(() => { if (!enabled) return; let unsubscribe: () => void = () => undefined; void subscribeForegroundMessages((payload) => { const data = payload.data ?? {}; const restaurant = data.type === "new_order"; setToast({ title: payload.notification?.title || (restaurant ? "\u0648\u0635\u0644\u0643 \u0637\u0644\u0628 \u062c\u062f\u064a\u062f" : "\u062a\u062d\u062f\u064a\u062b \u0637\u0644\u0628\u0643"), body: payload.notification?.body ?? "", url: typeof data.url === "string" && data.url.startsWith("/") ? data.url : role === "restaurant" ? "/restaurant-dashboard/orders" : "/orders", restaurant }); sound(restaurant); void refresh(); window.dispatchEvent(new CustomEvent("jibli:push", { detail: data })); }).then((cleanup) => { unsubscribe = cleanup; }); return () => unsubscribe(); }, [enabled, refresh, role]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 9000); return () => window.clearTimeout(timer); }, [toast]);
  const primeAudio = useCallback(() => { audioReady = true; sound(false); }, []); const value = useMemo(() => ({ primeAudio }), [primeAudio]);
  return <PushContext.Provider value={value}>{children}{toast && <aside role="status" className="fixed bottom-20 left-4 right-4 z-[100] mx-auto max-w-md rounded-3xl border border-orange-100 bg-white p-4 shadow-2xl md:bottom-6"><button type="button" onClick={() => setToast(null)} aria-label={"\u0625\u063a\u0644\u0627\u0642"} className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-gray-100"><X className="size-4" /></button><div className="flex gap-3 pl-8"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><BellRing className="size-5" /></span><div><p className="font-black">{toast.title}</p><p className="mt-1 text-xs leading-6 text-gray-500">{toast.body}</p><Link href={toast.url} onClick={() => setToast(null)} className="mt-3 inline-flex h-9 items-center rounded-xl bg-primary px-4 text-xs font-black text-white">{toast.restaurant ? "\u0639\u0631\u0636 \u0627\u0644\u0637\u0644\u0628" : "\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644"}</Link></div></div></aside>}</PushContext.Provider>;
}
function localStorageSafe() { try { return typeof window === "undefined" ? null : window.localStorage.getItem("jibli_push_enabled"); } catch { return null; } }
export function usePushNotifications() { return useContext(PushContext); }