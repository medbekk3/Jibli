export type UploadedImage = { url: string; publicId: string };
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maximumSize = 2 * 1024 * 1024;

export function validateImage(file: File) {
  if (!allowedTypes.includes(file.type)) throw new Error("صيغة الصورة غير مدعومة. استعمل JPG أو JPEG أو PNG أو WebP.");
  if (file.size > maximumSize) throw new Error("حجم الصورة يجب ألا يتجاوز 2 ميغابايت.");
}

export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
  validateImage(file);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error("لم يتم إعداد Cloudinary بعد. أضف بيانات الرفع إلى ملف البيئة.");
  const body = new FormData();
  body.append("file", file); body.append("upload_preset", uploadPreset); body.append("folder", folder);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
  if (!response.ok) throw new Error("تعذر رفع الصورة. حاول مرة أخرى.");
  const result = await response.json() as { secure_url?: string; public_id?: string };
  if (!result.secure_url || !result.public_id) throw new Error("لم تكتمل عملية رفع الصورة.");
  return { url: result.secure_url, publicId: result.public_id };
}
