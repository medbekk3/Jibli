import type { Category, Offer, Order, Product, Restaurant } from "@/types";

const foodImages = {
  pizza: "/images/pizza.svg",
  burger: "/images/burger.svg",
  shawarma: "/images/shawarma.svg",
  traditional: "/images/traditional.svg",
  dessert: "/images/dessert.svg",
  drink: "/images/drink.svg",
};

export const categories: Category[] = [
  { id: "pizza", name: "بيتزا", icon: "🍕" },
  { id: "shawarma", name: "شاورما", icon: "🌯" },
  { id: "burger", name: "برغر", icon: "🍔" },
  { id: "traditional", name: "أكل تقليدي", icon: "🍲" },
  { id: "dessert", name: "حلويات", icon: "🍰" },
  { id: "drinks", name: "مشروبات", icon: "🥤" },
];

export const restaurants: Restaurant[] = [
  { id: "narjis", name: "مطعم النرجس", description: "بيتزا وأطباق سريعة محضرة يومياً", image: foodImages.pizza, logo: foodImages.pizza, isOpen: true, deliveryTime: "25 - 35 دقيقة", deliveryFee: 150, minimumOrder: 500, rating: 4.8, category: "بيتزا", popular: true },
  { id: "andalous", name: "مذاق الأندلس", description: "شاورما وبرغر بطابع مميز", image: foodImages.shawarma, logo: foodImages.shawarma, isOpen: true, deliveryTime: "30 - 40 دقيقة", deliveryFee: 120, minimumOrder: 400, rating: 4.6, category: "شاورما", popular: true },
  { id: "darna", name: "دارنا للأكلات", description: "أطباق بريانية وتقليدية شهية", image: foodImages.traditional, logo: foodImages.traditional, isOpen: true, deliveryTime: "35 - 45 دقيقة", deliveryFee: 100, minimumOrder: 600, rating: 4.7, category: "أكل تقليدي", popular: true },
  { id: "bahja", name: "بهجة برغر", description: "برغر طازج ووجبات مشبعة", image: foodImages.burger, logo: foodImages.burger, isOpen: false, deliveryTime: "25 - 30 دقيقة", deliveryFee: 150, minimumOrder: 450, rating: 4.4, category: "برغر" },
];

export const products: Product[] = [
  { id: "margherita", restaurantId: "narjis", name: "بيتزا مارغريتا", description: "صلصة طماطم، جبن موزاريلا وأعشاب عطرية", image: foodImages.pizza, price: 700, category: "بيتزا" },
  { id: "chicken-pizza", restaurantId: "narjis", name: "بيتزا الدجاج", description: "دجاج متبل، جبن، فلفل وزيتون", image: foodImages.pizza, price: 950, category: "بيتزا" },
  { id: "shawarma-plate", restaurantId: "andalous", name: "طبق شاورما", description: "شاورما دجاج، بطاطا، سلطة وصلصة الثوم", image: foodImages.shawarma, price: 850, category: "شاورما" },
  { id: "classic-burger", restaurantId: "andalous", name: "برغر كلاسيكي", description: "لحم مشوي، جبن، خس وطماطم", image: foodImages.burger, price: 650, category: "برغر" },
  { id: "couscous", restaurantId: "darna", name: "كسكس بالخضار", description: "كسكس تقليدي بالخضار واللحم", image: foodImages.traditional, price: 1000, category: "أطباق رئيسية" },
  { id: "dolma", restaurantId: "darna", name: "دولمة بريانية", description: "طبق منزلي غني بالخضار واللحم", image: foodImages.traditional, price: 900, category: "أطباق رئيسية" },
  { id: "double-burger", restaurantId: "bahja", name: "برغر مزدوج", description: "قطعتا لحم، جبن وصوص خاص", image: foodImages.burger, price: 950, category: "برغر" },
  { id: "dessert", restaurantId: "narjis", name: "حلوى اليوم", description: "حلوى طازجة محضرة يومياً", image: foodImages.dessert, price: 300, category: "حلويات" },
  { id: "juice", restaurantId: "narjis", name: "عصير طازج", description: "عصير فواكه موسمية طبيعي", image: foodImages.drink, price: 250, category: "مشروبات" },
];

export const offers: Offer[] = [
  { id: "family", title: "وجبة العائلة", description: "خصم على طلبيتين بيتزا ومشروب عائلي", restaurantId: "narjis", image: foodImages.pizza },
  { id: "shawarma", title: "عرض الشاورما", description: "اشتر وجبتين واحصل على بطاطا مجاناً", restaurantId: "andalous", image: foodImages.shawarma },
];

export const orders: Order[] = [
  { id: "2458", restaurantName: "مطعم النرجس", date: "اليوم، 20:15", total: 1950, status: "جاري التحضير", items: ["بيتزا الدجاج × 1", "بيتزا مارغريتا × 1"], address: "حي النصر، قرب مكتب البريد" },
  { id: "2391", restaurantName: "دارنا للأكلات", date: "28 جويلية، 13:40", total: 1150, status: "تم التسليم", items: ["كسكس بالخضار × 1"], address: "وسط المدينة، شارع الاستقلال" },
  { id: "2304", restaurantName: "مذاق الأندلس", date: "22 جويلية، 21:10", total: 850, status: "تم الرفض", items: ["طبق شاورما × 1"], address: "الحي الجديد، قرب المسجد" },
];

export const neighborhoods = ["وسط المدينة", "حي النصر", "المنظر الجميل", "الحي الجديد", "حي المحطة"];

export const cartItems = [
  { product: products[1], quantity: 1, extras: ["زيادة جبن", "صوص إضافي"] },
  { product: products[0], quantity: 1, extras: [] },
];
