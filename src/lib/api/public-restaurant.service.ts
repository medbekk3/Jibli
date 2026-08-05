export type PublicRestaurant = {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  logoUrl: string;
  coverUrl: string;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  isActive: boolean;
  isOpen: boolean;
  isFeatured: boolean;
};

type PublicRestaurantResponse = {
  success: true;
  data: { restaurant: PublicRestaurant };
};

type PublicRestaurantFailure = {
  success: false;
  error?: { code?: string; message?: string };
};

export class PublicRestaurantError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = "PublicRestaurantError";
  }
}

export const publicRestaurantMessages: Record<string, string> = {
  RESTAURANT_NOT_FOUND: "المطعم غير موجود.",
  RESTAURANT_INACTIVE: "المطعم غير متاح حالياً.",
  RESTAURANT_CLOSED: "المطعم مغلق حالياً.",
  INVALID_RESTAURANT_ID: "بيانات المطعم غير صحيحة.",
  PUBLIC_RESTAURANT_LOAD_FAILED: "تعذر تحميل بيانات المطعم. حاول مرة أخرى.",
};

export async function getRestaurantById(id: string): Promise<PublicRestaurant> {
  const restaurantId = typeof id === "string" ? id.trim() : "";
  if (!restaurantId) throw new PublicRestaurantError("INVALID_RESTAURANT_ID", publicRestaurantMessages.INVALID_RESTAURANT_ID, 400);

  let response: Response;
  try {
    response = await fetch(`/api/public/restaurants/${encodeURIComponent(restaurantId)}`, { cache: "no-store" });
  } catch {
    throw new PublicRestaurantError("PUBLIC_RESTAURANT_LOAD_FAILED", publicRestaurantMessages.PUBLIC_RESTAURANT_LOAD_FAILED, 500);
  }

  const result = await response.json().catch(() => null) as PublicRestaurantResponse | PublicRestaurantFailure | null;
  if (!response.ok || !result?.success) {
    const code = result && !result.success ? result.error?.code ?? "PUBLIC_RESTAURANT_LOAD_FAILED" : "PUBLIC_RESTAURANT_LOAD_FAILED";
    const message = publicRestaurantMessages[code] ?? (result && !result.success ? result.error?.message : undefined) ?? publicRestaurantMessages.PUBLIC_RESTAURANT_LOAD_FAILED;
    throw new PublicRestaurantError(code, message, response.status);
  }
  return result.data.restaurant;
}
