export type Category = {
  id: string;
  name: string;
  icon: string;
  image?: string;
};

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  image: string;
  logo: string;
  isOpen: boolean;
  deliveryTime: string;
  deliveryFee: number;
  minimumOrder: number;
  rating: number;
  category: string;
  popular?: boolean;
  phone?: string;
  address?: string;
  workingHours?: string;
  displayOrder?: number;
};

export type Product = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  image: string;
  price: number;
  category: string;
  addons?: Array<{ id: string; name: string; price: number; isAvailable: boolean }>;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  restaurantId: string;
  image: string;
};

export type OrderStatus =
  | "تم إرسال الطلب"
  | "تم قبول الطلب"
  | "جاري التحضير"
  | "خرج للتوصيل"
  | "تم التسليم"
  | "تم الرفض";

export type Order = {
  id: string;
  restaurantName: string;
  date: string;
  total: number;
  status: OrderStatus;
  items: string[];
  address: string;
};
