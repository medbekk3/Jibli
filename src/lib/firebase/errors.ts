import { FirebaseError } from "firebase/app";

const messages: Record<string, string> = {
  "auth/email-already-in-use": "هذا البريد الإلكتروني مستعمل من قبل.",
  "auth/invalid-email": "البريد الإلكتروني غير صالح.",
  "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/user-disabled": "تم إيقاف هذا الحساب.",
  "auth/user-not-found": "لا يوجد حساب مرتبط بهذا البريد الإلكتروني.",
  "auth/wrong-password": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth/weak-password": "كلمة المرور ضعيفة. استعمل ستة أحرف على الأقل.",
  "auth/too-many-requests": "تمت محاولات كثيرة. حاول مرة أخرى لاحقاً.",
  "auth/network-request-failed": "تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مجدداً.",
};

export function getArabicAuthError(error: unknown) {
  if (error instanceof FirebaseError) return messages[error.code] ?? "حدث خطأ أثناء تنفيذ العملية. حاول مجدداً.";
  if (error instanceof Error && /[\u0600-\u06ff]/.test(error.message)) return error.message;
  return "حدث خطأ غير متوقع. حاول مجدداً.";
}
