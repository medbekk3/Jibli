import { FieldValue } from "firebase-admin/firestore";

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function cleanAddons(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((addon) => {
    const item = addon && typeof addon === "object" ? addon as Record<string, unknown> : {};
    return { id: text(item.id), name: text(item.name), price: Math.max(0, number(item.price)), isAvailable: Boolean(item.isAvailable) };
  }).filter((addon) => addon.id && addon.name);
}

export function cleanProductInput(value: unknown) {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    categoryId: text(item.categoryId), name: text(item.name), description: text(item.description),
    imageUrl: text(item.imageUrl), imagePublicId: text(item.imagePublicId), price: Math.max(0, number(item.price)),
    preparationTime: Math.max(0, number(item.preparationTime)), isAvailable: Boolean(item.isAvailable),
    isFeatured: Boolean(item.isFeatured), displayOrder: Math.max(0, number(item.displayOrder)), addons: cleanAddons(item.addons),
  };
}

export function cleanSettingsInput(value: unknown) {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    description: text(item.description), phone: text(item.phone), address: text(item.address), deliveryTime: text(item.deliveryTime),
    deliveryFee: Math.max(0, number(item.deliveryFee)), minimumOrder: Math.max(0, number(item.minimumOrder)), workingHours: text(item.workingHours),
    logoUrl: text(item.logoUrl), logoPublicId: text(item.logoPublicId), coverUrl: text(item.coverUrl), coverPublicId: text(item.coverPublicId),
    isOpen: Boolean(item.isOpen), updatedAt: FieldValue.serverTimestamp(),
  };
}
