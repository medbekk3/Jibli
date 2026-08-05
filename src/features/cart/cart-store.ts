"use client";
import { createContext } from "react";
import type { CartState } from "./cart-types";
export const CartStoreContext = createContext<CartState | null>(null);
