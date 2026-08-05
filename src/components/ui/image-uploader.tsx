"use client";

import { ImagePlus, LoaderCircle, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { uploadImage, validateImage } from "@/lib/cloudinary/upload";

export function ImageUploader({ label, folder, value, onUploaded }: { label: string; folder: string; value?: string; onUploaded: (image: { url: string; publicId: string }) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(value ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  const displayedPreview = preview || value || "";

  function choose(selected?: File) {
    if (!selected) return;
    setError("");
    try { validateImage(selected); setFile(selected); setPreview(URL.createObjectURL(selected)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "الصورة غير صالحة."); }
  }

  async function upload() {
    if (!file || uploading) return;
    setUploading(true); setError("");
    try { const result = await uploadImage(file, folder); onUploaded(result); setPreview(result.url); setFile(null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر رفع الصورة."); }
    finally { setUploading(false); }
  }

  return <div><p className="text-sm font-bold">{label}</p><div className="mt-2 overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-surface"><div className="relative grid h-40 place-items-center">{displayedPreview ? <Image src={displayedPreview} alt={`معاينة ${label}`} fill unoptimized className="object-cover" /> : <ImagePlus className="size-9 text-gray-300" />}</div><div className="flex gap-2 border-t border-gray-200 bg-white p-3"><label className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-gray-100 text-xs font-black"><input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => choose(event.target.files?.[0])} />اختيار صورة</label>{file && <button type="button" onClick={upload} disabled={uploading} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-black text-white disabled:opacity-60">{uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}{uploading ? "جاري الرفع..." : "رفع الصورة"}</button>}</div></div>{error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}<p className="mt-2 text-[11px] text-gray-400">JPG أو PNG أو WebP، بحد أقصى 2 ميغابايت.</p></div>;
}
