import { Bell, House, ReceiptText, ShoppingBag, ShoppingCart, UserRound } from "lucide-react";

export const mobileNavigation = [
  { label: "الرئيسية", href: "/", icon: House },
  { label: "المطاعم", href: "/restaurants", icon: ShoppingBag },
  { label: "السلة", href: "/cart", icon: ShoppingCart },
  { label: "طلباتي", href: "/orders", icon: ReceiptText },
  { label: "الإشعارات", href: "/notifications", icon: Bell },
  { label: "حسابي", href: "/profile", icon: UserRound },
];
