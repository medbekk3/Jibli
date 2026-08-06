export type CartAddon = { addonId: string; name: string; price: number };

export type CartItem = {
  cartItemId: string;
  productId: string;
  restaurantId: string;
  restaurantName: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  selectedAddons: CartAddon[];
  note: string;
  addonsTotal: number;
  itemTotal: number;
};

export type ValidatedCartAddon = { addonId: string; name: string; price: number };
export type ValidatedCartItem = { productId: string; name: string; imageUrl: string; unitPrice: number; isAvailable: boolean; selectedAddons: ValidatedCartAddon[]; addonsTotal: number; itemTotal: number };
export type CartValidationData = { restaurant: { id: string; name: string; isActive: boolean; isOpen: boolean; deliveryFee: number; minimumOrder: number }; items: ValidatedCartItem[]; subtotal: number; deliveryFee: number; total: number; hasChanges: boolean; changes: string[] };

export type NewCartItem = Omit<CartItem, "cartItemId" | "addonsTotal" | "itemTotal">;
export type AddItemResult = { ok: true } | { ok: false; reason: "DIFFERENT_RESTAURANT"; message: string };
export type CartState = {
  items: CartItem[]; hydrated: boolean;
  addItem: (item: NewCartItem) => AddItemResult;
  replaceCartWith: (item: NewCartItem) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  incrementQuantity: (cartItemId: string) => void;
  decrementQuantity: (cartItemId: string) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  updateItemNote: (cartItemId: string, note: string) => void;
  syncValidatedItems: (items: ValidatedCartItem[], restaurantName: string) => void;
  getItemsCount: () => number;
  getSubtotal: () => number;
  getRestaurantId: () => string | null;
  getRestaurantName: () => string | null;
  subtotal: number; addonsTotal: number; restaurantId: string | null; restaurantName: string | null;
};

export type CheckoutFormData = { firstName: string; lastName: string; phone: string; deliveryZoneId: string; address: string; landmark: string; customerNote: string };
export type PreparedOrderPayload = {
  restaurantId: string;
  deliveryZoneId: string;
  items: Array<{ productId: string; quantity: number; selectedAddonIds: string[]; note: string }>;
  deliveryAddress: { firstName: string; lastName: string; phone: string; area: string; address: string; landmark: string };
  customerNote: string;
};
