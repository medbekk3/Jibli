import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { publicProduct } from "@/lib/firebase/public-mappers";
import { logPublicFailure, publicFailure, publicSuccess } from "@/lib/firebase/public-response";

export const dynamic = "force-dynamic";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const product = await getAdminDb().collection("products").doc(id).get(); if (!product.exists || product.data()?.isAvailable !== true) return publicFailure("PRODUCT_NOT_AVAILABLE", "هذه الأكلة غير متوفرة حالياً.", 404); const restaurantId = String(product.data()?.restaurantId ?? ""); const restaurant = await getAdminDb().collection("restaurants").doc(restaurantId).get(); if (!restaurant.exists || restaurant.data()?.isActive !== true) return publicFailure("PRODUCT_NOT_AVAILABLE", "هذه الأكلة غير متوفرة حالياً.", 404); return publicSuccess({ product: publicProduct(product.id, product.data()!) }); } catch (error) { logPublicFailure("GET /api/products/[id]", error); return publicFailure("PRODUCT_LOAD_FAILED", "تعذر تحميل الأكلة. حاول مرة أخرى.", 500); } }
