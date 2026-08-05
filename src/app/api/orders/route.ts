import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireServerUser } from "@/lib/firebase/server-auth";
import { serializeDocument } from "@/lib/firebase/serialize-firestore";
import { logPushResult, sendPushToRestaurant } from "@/lib/firebase/push-notifications";

type RequestedItem = { productId: string; quantity: number; selectedAddonIds: string[]; note: string };

const messages: Record<string, string> = {
  RESTAURANT_NOT_FOUND: "المطعم غير موجود.", RESTAURANT_INACTIVE: "المطعم غير متاح حالياً.",
  RESTAURANT_CLOSED: "المطعم مغلق حالياً.", PRODUCT_NOT_FOUND: "إحدى الأكلات لم تعد موجودة.",
  ORDERING_DISABLED: "استقبال الطلبات متوقف مؤقتاً.",
  PRODUCT_UNAVAILABLE: "إحدى الأكلات غير متوفرة حالياً.", PRODUCT_RESTAURANT_MISMATCH: "توجد أكلة غير مرتبطة بهذا المطعم.",
  INVALID_ADDON: "إحدى الإضافات لم تعد متاحة.", MINIMUM_ORDER_NOT_REACHED: "لم تصل إلى الحد الأدنى للطلب.",
  INVALID_ORDER_DATA: "بيانات الطلب غير مكتملة.", ORDER_CREATE_FAILED: "تعذر إرسال الطلب. حاول مرة أخرى.",
};

const failure = (code: string, status: number, message = messages[code]) => NextResponse.json({ success: false, error: { code, message } }, { status });
const numberValue = (value: unknown) => { const number = Number(value); return Number.isFinite(number) ? number : 0; };
const text = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";
const validPhone = (value: unknown) => typeof value === "string" && /^(?:0[5-7]\d{8}|\+213[5-7]\d{8})$/.test(value.replace(/[\s-]/g, ""));

export async function GET(request: NextRequest) {
  const access = await requireServerUser(request, "customer");
  if (access.error) return access.error;
  try {
    const snapshot = await getAdminDb().collection("orders").where("customerId", "==", access.uid).limit(100).get();
    const orders = snapshot.docs.sort((a, b) => timestampMillis(b.data().createdAt) - timestampMillis(a.data().createdAt)).map((doc) => serializeDocument(doc.id, doc.data()));
    return NextResponse.json({ success: true, data: { orders } });
  } catch (error) {
    logOrderFailure("GET /api/orders", "قراءة طلبات الزبون", error, access.uid);
    return failure("ORDERS_LOAD_FAILED", 500, "تعذر تحميل طلباتك. حاول مرة أخرى.");
  }
}

export async function POST(request: NextRequest) {
  const access = await requireServerUser(request, "customer");
  if (access.error) return access.error;

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return failure("INVALID_ORDER_DATA", 400); }

  const restaurantId = text(body.restaurantId, 128);
  const address = body.deliveryAddress && typeof body.deliveryAddress === "object" ? body.deliveryAddress as Record<string, unknown> : {};
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const requested: RequestedItem[] = rawItems.map((value) => {
    const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return { productId: text(item.productId, 128), quantity: Number(item.quantity), selectedAddonIds: Array.isArray(item.selectedAddonIds) ? [...new Set(item.selectedAddonIds.filter((id): id is string => typeof id === "string").map((id) => id.trim()).filter(Boolean))] : [], note: text(item.note, 300) };
  });
  if (!restaurantId || !requested.length || requested.length > 50 || requested.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) return failure("INVALID_ORDER_DATA", 400);
  if (!text(address.firstName, 80) || !text(address.lastName, 80) || !validPhone(address.phone) || !text(address.area, 120) || !text(address.address, 300)) return failure("INVALID_ORDER_DATA", 400, "معلومات التوصيل غير مكتملة أو رقم الهاتف غير صالح.");

  try {
    const database = getAdminDb();
    const restaurantSnapshot = await database.collection("restaurants").doc(restaurantId).get();
    if (!restaurantSnapshot.exists) return failure("RESTAURANT_NOT_FOUND", 404);
    const restaurant = restaurantSnapshot.data() ?? {};
    const settingsSnapshot = await database.collection("settings").doc("general").get();
    if (settingsSnapshot.exists && settingsSnapshot.data()?.acceptingOrders === false) return failure("ORDERING_DISABLED", 409);

    if (restaurant.isActive !== true) return failure("RESTAURANT_INACTIVE", 409);
    if (restaurant.isOpen !== true) return failure("RESTAURANT_CLOSED", 409);

    const snapshots = await database.getAll(...[...new Set(requested.map((item) => item.productId))].map((id) => database.collection("products").doc(id)));
    const products = new Map(snapshots.filter((snapshot) => snapshot.exists).map((snapshot) => [snapshot.id, snapshot.data() ?? {}]));
    const items = [];
    let subtotal = 0;
    for (const requestedItem of requested) {
      const product = products.get(requestedItem.productId);
      if (!product) return failure("PRODUCT_NOT_FOUND", 404);
      if (product.restaurantId !== restaurantId) return failure("PRODUCT_RESTAURANT_MISMATCH", 409);
      if (product.isAvailable !== true) return failure("PRODUCT_UNAVAILABLE", 409);
      const productAddons = Array.isArray(product.addons) ? product.addons : [];
      const addons = requestedItem.selectedAddonIds.map((addonId) => {
        const addon = productAddons.find((value) => value && typeof value === "object" && String((value as Record<string, unknown>).id ?? "") === addonId) as Record<string, unknown> | undefined;
        return addon?.isAvailable === true ? { addonId, name: text(addon.name, 100), price: Math.max(0, numberValue(addon.price)) } : null;
      });
      if (addons.some((addon) => addon === null)) return failure("INVALID_ADDON", 409);
      const safeAddons = addons.filter((addon): addon is NonNullable<typeof addon> => addon !== null);
      const unitPrice = Math.max(0, numberValue(product.price));
      const addonsTotal = safeAddons.reduce((sum, addon) => sum + addon.price, 0);
      const itemTotal = (unitPrice + addonsTotal) * requestedItem.quantity;
      subtotal += itemTotal;
      items.push({ productId: requestedItem.productId, name: text(product.name, 160), imageUrl: text(product.imageUrl, 1000), unitPrice, quantity: requestedItem.quantity, addons: safeAddons, addonsTotal, itemTotal, note: requestedItem.note });
    }

    const minimumOrder = Math.max(0, numberValue(restaurant.minimumOrder));
    if (subtotal < minimumOrder) return failure("MINIMUM_ORDER_NOT_REACHED", 409, `لم تصل إلى الحد الأدنى للطلب وهو ${minimumOrder} د.ج.`);
    const deliveryFee = Math.max(0, numberValue(restaurant.deliveryFee));
    const total = subtotal + deliveryFee;
    const orderRef = database.collection("orders").doc();
    const orderNumber = `JBL-${dateInAlgiers()}-${orderRef.id.slice(0, 4).toUpperCase()}`;
    const now = FieldValue.serverTimestamp();
    const batch = database.batch();
    batch.set(orderRef, {
      id: orderRef.id, orderNumber, customerId: access.uid,
      customerName: `${text(address.firstName, 80)} ${text(address.lastName, 80)}`, customerPhone: text(address.phone, 30),
      restaurantId, restaurantName: text(restaurant.name, 160), restaurantPhone: text(restaurant.phone, 30), items,
      subtotal, deliveryFee, total, paymentMethod: "cash_on_delivery", paymentStatus: "unpaid", status: "pending",
      deliveryAddress: { firstName: text(address.firstName, 80), lastName: text(address.lastName, 80), phone: text(address.phone, 30), area: text(address.area, 120), address: text(address.address, 300), landmark: text(address.landmark, 200) },
      customerNote: text(body.customerNote, 500), restaurantNote: "", estimatedPreparationTime: null,
      rejectionReason: "", cancellationReason: "", createdAt: now, updatedAt: now,
      acceptedAt: null, preparingAt: null, outForDeliveryAt: null, deliveredAt: null, rejectedAt: null, cancelledAt: null,
    });
    batch.set(orderRef.collection("statusHistory").doc(), { status: "pending", changedBy: access.uid, changedByRole: "customer", note: "تم إرسال الطلب", createdAt: now });
    if (typeof restaurant.ownerId === "string" && restaurant.ownerId) batch.set(database.collection("notifications").doc(`new_order_${orderRef.id}`), { title: "طلب جديد 🔔", body: `وصلك طلب جديد رقم ${orderNumber} بقيمة ${total} دج.`, audience: "user", targetUserId: restaurant.ownerId, type: "order", link: `/restaurant-dashboard/orders/${orderRef.id}`, isActive: true, createdAt: now, updatedAt: now });
    await batch.commit();
    try {
      const pushResult = await sendPushToRestaurant(restaurantId, {
        notification: { title: "\u0637\u0644\u0628 \u062c\u062f\u064a\u062f \ud83d\udd14", body: `\u0648\u0635\u0644\u0643 \u0637\u0644\u0628 \u062c\u062f\u064a\u062f \u0631\u0642\u0645 ${orderNumber} \u0628\u0642\u064a\u0645\u0629 ${total} \u062f\u062c.` },
        data: { type: "new_order", orderId: orderRef.id, orderNumber, url: `/restaurant-dashboard/orders/${orderRef.id}`, status: "pending" },
      });
      logPushResult(`new_order:${orderRef.id}`, pushResult);
    } catch (pushError) {
      console.warn("[push]", { event: `new_order:${orderRef.id}`, errorCode: pushError instanceof Error ? (pushError as Error & { code?: string }).code ?? "push-failed" : "push-failed" });
    }
    return NextResponse.json({ success: true, data: { orderId: orderRef.id, orderNumber, status: "pending", total } }, { status: 201 });
  } catch (error) {
    logOrderFailure("POST /api/orders", "إنشاء الطلب", error, access.uid);
    return failure("ORDER_CREATE_FAILED", 500);
  }
}

function dateInAlgiers() { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Algiers", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ""; return `${get("year")}${get("month")}${get("day")}`; }
function timestampMillis(value: unknown) { return value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function" ? (value as { toMillis: () => number }).toMillis() : 0; }
function logOrderFailure(api: string, stage: string, error: unknown, uid: string) { const details = error instanceof Error ? { code: (error as Error & { code?: string }).code ?? "unknown", message: error.message } : { code: "unknown", message: "خطأ غير معروف" }; console.error("[الطلبات] فشل الطلب", { api, stage, uid, errorCode: details.code, errorMessage: details.message }); }
