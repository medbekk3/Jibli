import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { publicFailure, publicSuccess } from "@/lib/firebase/public-response";

type RequestItem = {
  productId: string;
  quantity: number;
  selectedAddonIds: string[];
};

const toNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

function logFailure(stage: string, restaurantId: string, productIds: string[], error: unknown) {
  const details = error instanceof Error
    ? { code: (error as Error & { code?: string }).code ?? "unknown", message: error.message }
    : { code: "unknown", message: "خطأ غير معروف" };
  console.error("[التحقق من السلة] فشل الطلب", {
    stage,
    restaurantId,
    productIds,
    errorCode: details.code,
    errorMessage: details.message,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    logFailure("قراءة الطلب", "", [], error);
    return publicFailure("INVALID_CART_DATA", "بيانات السلة غير صالحة.", 400);
  }

  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const restaurantId = typeof record.restaurantId === "string" ? record.restaurantId.trim() : "";
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items: RequestItem[] = rawItems.map((value) => {
    const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return {
      productId: typeof item.productId === "string" ? item.productId.trim() : "",
      quantity: Math.max(1, Math.min(99, Math.trunc(toNumber(item.quantity)))),
      selectedAddonIds: Array.isArray(item.selectedAddonIds)
        ? [...new Set(item.selectedAddonIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())).map((id) => id.trim()))]
        : [],
    };
  });
  const productIds = items.map((item) => item.productId);

  if (!restaurantId || !items.length || items.length > 50 || items.some((item) => !item.productId)) {
    return publicFailure("INVALID_CART_DATA", "بيانات السلة غير مكتملة.", 400);
  }

  try {
    const database = getAdminDb();
    const restaurantDocument = await database.collection("restaurants").doc(restaurantId).get();
    if (!restaurantDocument.exists) return publicFailure("RESTAURANT_NOT_FOUND", "المطعم غير موجود.", 404);

    const restaurant = restaurantDocument.data() ?? {};
    if (restaurant.isActive !== true) return publicFailure("RESTAURANT_INACTIVE", "المطعم غير متاح حالياً.", 409);
    if (restaurant.isOpen !== true) return publicFailure("RESTAURANT_CLOSED", "المطعم مغلق حالياً.", 409);

    const uniqueProductIds = [...new Set(productIds)];
    const snapshots = await database.getAll(
      ...uniqueProductIds.map((id) => database.collection("products").doc(id)),
    );
    const products = new Map(
      snapshots.filter((snapshot) => snapshot.exists).map((snapshot) => [snapshot.id, snapshot.data() ?? {}]),
    );

    const validatedItems = [];
    let subtotal = 0;
    for (const item of items) {
      const product = products.get(item.productId);
      if (!product) return publicFailure("PRODUCT_NOT_FOUND", "أحد المنتجات لم يعد موجوداً.", 404);
      if (product.restaurantId !== restaurantId) return publicFailure("PRODUCT_RESTAURANT_MISMATCH", "يوجد منتج غير مرتبط بهذا المطعم.", 409);
      if (product.isAvailable !== true) return publicFailure("PRODUCT_UNAVAILABLE", "أحد المنتجات غير متوفر حالياً.", 409);

      const productAddons = Array.isArray(product.addons) ? product.addons : [];
      const selectedAddons = item.selectedAddonIds.map((addonId) => {
        const addon = productAddons.find((value) => value && typeof value === "object" && String((value as Record<string, unknown>).id ?? "") === addonId) as Record<string, unknown> | undefined;
        return addon?.isAvailable === true
          ? { addonId, name: String(addon.name ?? ""), price: Math.max(0, toNumber(addon.price)) }
          : null;
      });
      if (selectedAddons.some((addon) => addon === null)) {
        return publicFailure("INVALID_ADDON", "إحدى الإضافات لم تعد متاحة.", 409);
      }

      const safeAddons = selectedAddons.filter((addon): addon is NonNullable<typeof addon> => addon !== null);
      const unitPrice = Math.max(0, toNumber(product.price));
      const addonsTotal = safeAddons.reduce((total, addon) => total + addon.price, 0);
      const itemTotal = (unitPrice + addonsTotal) * item.quantity;
      subtotal += itemTotal;
      validatedItems.push({
        productId: item.productId,
        name: String(product.name ?? ""),
        imageUrl: String(product.imageUrl ?? ""),
        unitPrice,
        isAvailable: true,
        selectedAddons: safeAddons,
        addonsTotal,
        itemTotal,
      });
    }

    const deliveryFee = Math.max(0, toNumber(restaurant.deliveryFee));
    return publicSuccess({
      restaurant: {
        id: restaurantDocument.id,
        name: String(restaurant.name ?? ""),
        isActive: true,
        isOpen: true,
        deliveryFee,
        minimumOrder: Math.max(0, toNumber(restaurant.minimumOrder)),
      },
      items: validatedItems,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      hasChanges: false,
      changes: [],
    });
  } catch (error) {
    logFailure("قراءة Firestore والتحقق", restaurantId, productIds, error);
    return publicFailure("CART_VALIDATION_FAILED", "تعذر التحقق من بيانات السلة. حاول مرة أخرى.", 500);
  }
}
