"use client";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CartStoreContext } from "./cart-store";
import type { CartItem, NewCartItem, ValidatedCartItem } from "./cart-types";
import { CART_STORAGE_KEY, calculateItemTotal, clampQuantity, isStoredCartItem, itemSignature, normalizeCartItem } from "./cart-utils";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]); const [hydrated, setHydrated] = useState(false);
  useEffect(() => { void Promise.resolve().then(() => { try { const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]") as unknown; if (Array.isArray(stored)) setItems(stored.filter(isStoredCartItem).map((item) => normalizeCartItem(item, item.cartItemId))); } catch { localStorage.removeItem(CART_STORAGE_KEY); } finally { setHydrated(true); } }); }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); }, [hydrated, items]);
  const insert = useCallback((item: NewCartItem, replace = false) => setItems((current) => { const base = replace ? [] : current; const signature = itemSignature(item); const existing = base.find((entry) => itemSignature(entry) === signature); if (existing) return base.map((entry) => entry.cartItemId === existing.cartItemId ? normalizeCartItem({ ...entry, quantity: entry.quantity + item.quantity }, entry.cartItemId) : entry); return [...base, normalizeCartItem(item)]; }), []);
  const addItem = useCallback((item: NewCartItem) => { if (items.length && items[0].restaurantId !== item.restaurantId) return { ok: false as const, reason: "DIFFERENT_RESTAURANT" as const, message: "تحتوي سلتك على طلب من مطعم آخر. هل تريد تفريغ السلة وإضافة هذه الأكلة؟" }; insert(item); return { ok: true as const }; }, [insert, items]);
  const replaceCartWith = useCallback((item: NewCartItem) => insert(item, true), [insert]);
  const updateQuantity = useCallback((id: string, quantity: number) => setItems((current) => current.map((item) => item.cartItemId === id ? { ...item, quantity: clampQuantity(quantity), itemTotal: calculateItemTotal({ ...item, quantity: clampQuantity(quantity) }) } : item)), []);
  const incrementQuantity = useCallback((id: string) => setItems((current) => current.map((item) => item.cartItemId === id ? normalizeCartItem({ ...item, quantity: item.quantity + 1 }, item.cartItemId) : item)), []);
  const decrementQuantity = useCallback((id: string) => setItems((current) => current.map((item) => item.cartItemId === id ? normalizeCartItem({ ...item, quantity: Math.max(1, item.quantity - 1) }, item.cartItemId) : item)), []);
  const removeItem = useCallback((id: string) => setItems((current) => current.filter((item) => item.cartItemId !== id)), []); const clearCart = useCallback(() => setItems([]), []);
  const updateItemNote = useCallback((id: string, note: string) => setItems((current) => current.map((item) => item.cartItemId === id ? { ...item, note: note.trim() } : item)), []);
  const syncValidatedItems = useCallback((validatedItems: ValidatedCartItem[], restaurantName: string) => {
    setItems((current) => current.map((item, index) => {
      const validated = validatedItems[index];
      if (!validated || validated.productId !== item.productId) return item;
      return normalizeCartItem({
        ...item,
        restaurantName,
        productName: validated.name,
        imageUrl: validated.imageUrl,
        unitPrice: validated.unitPrice,
        selectedAddons: validated.selectedAddons,
      }, item.cartItemId);
    }));
  }, []);
  const subtotal = items.reduce((total, item) => total + item.itemTotal, 0); const addonsTotal = items.reduce((total, item) => total + item.addonsTotal * item.quantity, 0);
  const value = useMemo(() => ({ items, hydrated, addItem, replaceCartWith, updateQuantity, incrementQuantity, decrementQuantity, removeItem, clearCart, updateItemNote, syncValidatedItems, getItemsCount: () => items.reduce((total, item) => total + item.quantity, 0), getSubtotal: () => subtotal, getRestaurantId: () => items[0]?.restaurantId ?? null, getRestaurantName: () => items[0]?.restaurantName ?? null, subtotal, addonsTotal, restaurantId: items[0]?.restaurantId ?? null, restaurantName: items[0]?.restaurantName ?? null }), [addItem, addonsTotal, clearCart, decrementQuantity, hydrated, incrementQuantity, items, removeItem, replaceCartWith, subtotal, syncValidatedItems, updateItemNote, updateQuantity]);
  return <CartStoreContext.Provider value={value}>{children}</CartStoreContext.Provider>;
}
