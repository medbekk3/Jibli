"use client";

import { useCallback, useEffect, useState } from "react";
import { loadPublicCategories, loadPublicOffers, loadPublicProduct, loadPublicProducts, loadPublicRestaurant, loadPublicRestaurants } from "@/lib/firebase/public-data";
import type { Category, Offer, Product, Restaurant } from "@/types";

type State<T> = { data: T; loading: boolean; error: string; retry: () => void };
const loadHome = async () => { const restaurants = await loadPublicRestaurants(); const [categories, offers] = await Promise.all([loadPublicCategories().catch(() => []), loadPublicOffers().catch(() => [])]); return { restaurants, categories, offers }; };
const loadRestaurants = () => loadPublicRestaurants();
const loadRestaurant = async (id: string) => ({ restaurant: await loadPublicRestaurant(id), products: await loadPublicProducts(id) });
const loadProduct = (id: string) => loadPublicProduct(id);

function useLoad<T>(loader: (dependency: string) => Promise<T>, initial: T, dependency = "", fallbackError = "تعذر تحميل البيانات. حاول مرة أخرى."): State<T> {
  const [state, setState] = useState({ data: initial, loading: true, error: "" }); const [version, setVersion] = useState(0);
  const retry = useCallback(() => { setState((current) => ({ ...current, loading: true, error: "" })); setVersion((current) => current + 1); }, []);
  useEffect(() => { let active = true; loader(dependency).then((data) => { if (active) setState({ data, loading: false, error: "" }); }).catch((error) => { if (active) setState((current) => ({ ...current, loading: false, error: error instanceof Error && error.message ? error.message : fallbackError })); }); return () => { active = false; }; }, [dependency, fallbackError, loader, version]);
  return { ...state, retry };
}

export function useHomeData() { return useLoad(loadHome, { restaurants: [] as Restaurant[], categories: [] as Category[], offers: [] as Offer[] }, "", "تعذر تحميل المطاعم. حاول مرة أخرى."); }
export function useRestaurantsData() { return useLoad(loadRestaurants, [] as Restaurant[], "", "تعذر تحميل المطاعم. حاول مرة أخرى."); }
export function useRestaurantData(id: string) { return useLoad(loadRestaurant, { restaurant: null as Restaurant | null, products: [] as Product[] }, id, "تعذر تحميل المطعم. حاول مرة أخرى."); }
export function useProductData(id: string) { return useLoad(loadProduct, null as Product | null, id, "تعذر تحميل الأكلة. حاول مرة أخرى."); }
