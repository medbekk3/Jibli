export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { publicProduct } from "@/lib/firebase/public-mappers";
import { logPublicFailure, publicFailure, publicSuccess } from "@/lib/firebase/public-response";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const restaurant = await adminDb.collection("restaurants").doc(id).get(); if (!restaurant.exists || restaurant.data()?.isActive !== true) return publicFailure("RESTAURANT_NOT_AVAILABLE", "المطعم غير متاح حالياً.", 404); const snapshot = await adminDb.collection("products").where("restaurantId", "==", id).where("isAvailable", "==", true).get(); const products = snapshot.docs.sort((a, b) => Number(a.data().displayOrder ?? 0) - Number(b.data().displayOrder ?? 0)).map((document) => publicProduct(document.id, document.data())); return publicSuccess({ products }); } catch (error) { logPublicFailure("GET /api/restaurants/[id]/products", error); return publicFailure("PRODUCTS_LOAD_FAILED", "تعذر تحميل قائمة الطعام. حاول مرة أخرى.", 500); } }
