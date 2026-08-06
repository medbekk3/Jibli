export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { publicProduct } from "@/lib/firebase/public-mappers";
import { logPublicFailure, publicFailure, publicSuccess } from "@/lib/firebase/public-response";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const product = await adminDb.collection("products").doc(id).get(); if (!product.exists || product.data()?.isAvailable !== true) return publicFailure("PRODUCT_NOT_AVAILABLE", "هذه الأكلة غير متوفرة حالياً.", 404); const restaurantId = String(product.data()?.restaurantId ?? ""); const restaurant = await adminDb.collection("restaurants").doc(restaurantId).get(); if (!restaurant.exists || restaurant.data()?.isActive !== true) return publicFailure("PRODUCT_NOT_AVAILABLE", "هذه الأكلة غير متوفرة حالياً.", 404); return publicSuccess({ product: publicProduct(product.id, product.data()!) }); } catch (error) { logPublicFailure("GET /api/products/[id]", error); return publicFailure("PRODUCT_LOAD_FAILED", "تعذر تحميل الأكلة. حاول مرة أخرى.", 500); } }
