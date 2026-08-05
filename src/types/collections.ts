import type { Timestamp } from "firebase/firestore";

import type { AccountStatus, UserRole } from "./auth";

export interface UserDocument { uid: string; firstName: string; lastName: string; fullName: string; phone: string; email: string; role: UserRole; status: AccountStatus; createdAt: Timestamp; updatedAt: Timestamp; lastLoginAt?: Timestamp; }

export interface RestaurantDocument {
  id: string; name: string; description: string; phone: string; address: string;
  logoUrl: string; logoPublicId: string; coverUrl: string; coverPublicId: string;
  deliveryTime: string; deliveryFee: number; minimumOrder: number; isOpen: boolean;
  isActive: boolean; isFeatured: boolean; displayOrder: number; workingHours: string;
  ownerId: string; createdAt: Timestamp; updatedAt: Timestamp;
}

export interface CategoryDocument { id: string; name: string; imageUrl: string; imagePublicId: string; isActive: boolean; displayOrder: number; createdAt: Timestamp; updatedAt: Timestamp; }
export interface ProductAddon { id: string; name: string; price: number; isAvailable: boolean; }
export interface ProductDocument {
  id: string; restaurantId: string; categoryId: string; name: string; description: string;
  imageUrl: string; imagePublicId: string; price: number; preparationTime: number;
  isAvailable: boolean; isFeatured: boolean; displayOrder: number; addons: ProductAddon[];
  createdAt: Timestamp; updatedAt: Timestamp;
}
export type OrderStatusCode = "pending" | "accepted" | "preparing" | "out_for_delivery" | "delivered" | "rejected" | "cancelled";
export type PaymentStatus = "unpaid" | "paid";
export interface OrderAddon { addonId: string; name: string; price: number; }
export interface OrderItem { productId: string; name: string; imageUrl: string; unitPrice: number; quantity: number; addons: OrderAddon[]; addonsTotal: number; itemTotal: number; note: string; }
export interface DeliveryAddress { firstName: string; lastName: string; phone: string; area: string; address: string; landmark: string; }
export interface OrderDocument {
  id: string; orderNumber: string; customerId: string; customerName: string; customerPhone: string;
  restaurantId: string; restaurantName: string; restaurantPhone: string; items: OrderItem[];
  subtotal: number; deliveryFee: number; total: number; paymentMethod: "cash_on_delivery";
  paymentStatus: PaymentStatus; status: OrderStatusCode; deliveryAddress: DeliveryAddress;
  customerNote: string; restaurantNote: string; estimatedPreparationTime: number | null;
  rejectionReason?: string; cancellationReason?: string;
  createdAt: Timestamp; updatedAt: Timestamp; acceptedAt: Timestamp | null; preparingAt: Timestamp | null;
  outForDeliveryAt: Timestamp | null; deliveredAt: Timestamp | null; rejectedAt: Timestamp | null; cancelledAt: Timestamp | null;
}
export interface OfferDocument { id: string; restaurantId: string; title: string; description: string; imageUrl: string; imagePublicId: string; isActive: boolean; startsAt: Timestamp; endsAt: Timestamp; discountType?: "percentage" | "fixed"; discountValue?: number; displayOrder?: number; createdAt: Timestamp; updatedAt: Timestamp; }
export interface AppSettingsDocument { appName: string; logoUrl: string; supportPhone: string; welcomeText: string; acceptingOrders: boolean; platformFee: number; city: string; neighborhoods: string[]; defaultDeliveryFee: number; defaultMinimumOrder: number; updatedAt?: Timestamp; }

export type CreateRestaurantInput = Omit<RestaurantDocument, "id" | "createdAt" | "updatedAt">;
export type CreateCategoryInput = Omit<CategoryDocument, "id" | "createdAt" | "updatedAt">;
export type CreateProductInput = Omit<ProductDocument, "id" | "createdAt" | "updatedAt">;
