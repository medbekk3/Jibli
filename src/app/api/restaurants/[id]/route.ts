import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { publicRestaurant } from "@/lib/firebase/public-mappers";
import { logPublicFailure, publicFailure, publicSuccess } from "@/lib/firebase/public-response";

export const dynamic = "force-dynamic";
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const document = await getAdminDb().collection("restaurants").doc(id).get(); if (!document.exists || document.data()?.isActive !== true) return publicFailure("RESTAURANT_NOT_AVAILABLE", "المطعم غير متاح حالياً.", 404); return publicSuccess({ restaurant: publicRestaurant(document.id, document.data()!) }); } catch (error) { logPublicFailure("GET /api/restaurants/[id]", error); return publicFailure("RESTAURANT_LOAD_FAILED", "تعذر تحميل المطعم. حاول مرة أخرى.", 500); } }
