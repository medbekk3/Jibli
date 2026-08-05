import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { adminFailure, adminSuccess, logAdminApiFailure } from "@/lib/firebase/admin-response";
import { isAdminSessionError, requireActiveAdminSession } from "@/lib/firebase/admin-session";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";

const millis = (value: unknown) => value instanceof Timestamp ? value.toMillis() : value instanceof Date ? value.getTime() : typeof value === "string" ? Date.parse(value) || 0 : 0;
const amount = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export async function GET() {
  try {
    await requireActiveAdminSession();
    const db = getAdminDb();
    const [restaurants, users, categories, products, offers, orders, activities] = await Promise.all([
      db.collection("restaurants").get(), db.collection("users").get(), db.collection("categories").get(),
      db.collection("products").get(), db.collection("offers").get(), db.collection("orders").orderBy("createdAt", "desc").limit(5000).get(),
      db.collection("adminActivityLogs").orderBy("createdAt", "desc").limit(10).get(),
    ]);
    const restaurantRows: Record<string, unknown>[] = restaurants.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const userRows: Record<string, unknown>[] = users.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    const productRows: Record<string, unknown>[] = products.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const orderRows: Record<string, unknown>[] = orders.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const delivered = orderRows.filter((item) => item.status === "delivered");
    const ongoing = new Set(["accepted", "preparing", "out_for_delivery"]);
    const newest = <T extends Record<string, unknown>>(rows: T[]) => [...rows].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, 5);
    return adminSuccess({
      stats: {
        restaurants: restaurants.size, activeRestaurants: restaurantRows.filter((item) => item.isActive === true).length,
        closedRestaurants: restaurantRows.filter((item) => item.isOpen !== true).length, users: users.size,
        customers: userRows.filter((item) => item.role === "customer").length,
        restaurantUsers: userRows.filter((item) => item.role === "restaurant").length,
        categories: categories.size, products: products.size, offers: offers.size, orders: orderRows.length,
        dailyOrders: orderRows.filter((item) => millis(item.createdAt) >= today.getTime()).length,
        newOrders: orderRows.filter((item) => item.status === "pending").length,
        ongoingOrders: orderRows.filter((item) => ongoing.has(String(item.status))).length,
        completedOrders: delivered.length,
        rejectedOrCancelledOrders: orderRows.filter((item) => item.status === "rejected" || item.status === "cancelled").length,
        totalSales: delivered.reduce((sum, item) => sum + amount(item.total), 0),
        totalDeliveryFees: delivered.reduce((sum, item) => sum + amount(item.deliveryFee), 0),
      },
      latestRestaurants: newest(restaurantRows).map((item) => serializeDocument(String(item.id), item)),
      latestUsers: newest(userRows).map((item) => serializeDocument(String(item.uid), item)),
      latestProducts: newest(productRows).map((item) => serializeDocument(String(item.id), item)),
      latestOrders: newest(orderRows).map((item) => serializeDocument(String(item.id), item)),
      suspendedRestaurants: restaurantRows.filter((item) => item.isActive !== true).slice(0, 5).map((item) => serializeDocument(String(item.id), item)),
      activityLogs: activities.docs.map((doc) => serializeDocument(doc.id, doc.data())),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logAdminApiFailure("GET /api/admin/dashboard", "تحميل البيانات والإحصاءات", error);
    if (isAdminSessionError(error)) return adminFailure(error.code, error.message, error.status);
    return adminFailure("DASHBOARD_LOAD_FAILED", "تعذر تحميل بيانات لوحة الإدارة.", 500);
  }
}
