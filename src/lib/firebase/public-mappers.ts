import { serializeFirestoreData } from "./serialize-firestore";

const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function publicRestaurant(id: string, data: Record<string, unknown>) {
  return serializeFirestoreData({ id, name: text(data.name), description: text(data.description), phone: text(data.phone), address: text(data.address), logoUrl: text(data.logoUrl), coverUrl: text(data.coverUrl), deliveryTime: text(data.deliveryTime), deliveryFee: number(data.deliveryFee), minimumOrder: number(data.minimumOrder), workingHours: text(data.workingHours), isOpen: data.isOpen === true, isActive: data.isActive === true, isFeatured: data.isFeatured === true, displayOrder: number(data.displayOrder), createdAt: data.createdAt ?? null });
}

export function publicProduct(id: string, data: Record<string, unknown>) {
  const addons = Array.isArray(data.addons) ? data.addons.map((value) => { const addon = value && typeof value === "object" ? value as Record<string, unknown> : {}; return { id: text(addon.id), name: text(addon.name), price: number(addon.price), isAvailable: addon.isAvailable === true }; }) : [];
  return serializeFirestoreData({ id, restaurantId: text(data.restaurantId), categoryId: text(data.categoryId), name: text(data.name), description: text(data.description), imageUrl: text(data.imageUrl), price: number(data.price), addons });
}

export function timestampMillis(value: unknown) { return value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function" ? (value as { toMillis: () => number }).toMillis() : 0; }
