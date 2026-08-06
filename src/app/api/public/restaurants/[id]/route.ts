export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { publicRestaurant } from "@/lib/firebase/public-mappers";
import { logPublicFailure, publicFailure, publicSuccess } from "@/lib/firebase/public-response";


export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = typeof rawId === "string" ? rawId.trim() : "";
  if (!id) return publicFailure("INVALID_RESTAURANT_ID", "بيانات المطعم غير صحيحة.", 400);

  try {
    const document = await adminDb.collection("restaurants").doc(id).get();
    if (!document.exists) return publicFailure("RESTAURANT_NOT_FOUND", "المطعم غير موجود.", 404);
    const data = document.data() ?? {};
    if (data.isActive !== true) return publicFailure("RESTAURANT_INACTIVE", "المطعم غير متاح حالياً.", 409);
    const mapped = publicRestaurant(document.id, data) as {
      id: string; name: string; description: string; phone: string; address: string;
      logoUrl: string; coverUrl: string; deliveryTime: string; deliveryFee: number;
      minimumOrder: number; isActive: boolean; isOpen: boolean; isFeatured: boolean;
    };
    return publicSuccess({ restaurant: {
      id: mapped.id,
      name: mapped.name,
      description: mapped.description,
      phone: mapped.phone,
      address: mapped.address,
      logoUrl: mapped.logoUrl,
      coverUrl: mapped.coverUrl,
      deliveryTime: mapped.deliveryTime,
      deliveryFee: mapped.deliveryFee,
      minimumOrder: mapped.minimumOrder,
      isActive: mapped.isActive,
      isOpen: mapped.isOpen,
      isFeatured: mapped.isFeatured,
    } });
  } catch (error) {
    logPublicFailure("GET /api/public/restaurants/[id]", error, { restaurantId: id });
    return publicFailure("PUBLIC_RESTAURANT_LOAD_FAILED", "تعذر تحميل بيانات المطعم. حاول مرة أخرى.", 500);
  }
}
