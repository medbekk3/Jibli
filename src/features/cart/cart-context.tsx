"use client";
import { useContext } from "react";
import { CartProvider } from "./cart-provider";
import { CartStoreContext } from "./cart-store";
export { CartProvider };
export type { CartAddon, CartItem, CartState, CheckoutFormData, PreparedOrderPayload } from "./cart-types";
export function useCart() { const value = useContext(CartStoreContext); if (!value) throw new Error("يجب استعمال السلة داخل مزود السلة."); return value; }
