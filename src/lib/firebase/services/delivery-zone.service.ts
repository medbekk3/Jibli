import { adminApi } from "../admin-api";
import type { DeliveryZone } from "@/lib/delivery-zones";
type Envelope<T>={success:true;data:T}|{success:false;error?:{message?:string}};
export async function getActiveDeliveryZones(){const response=await fetch("/api/delivery-zones",{cache:"no-store"});const result=await response.json() as Envelope<{zones:DeliveryZone[]}>;if(!response.ok||!result.success)throw new Error(!result.success?result.error?.message:"تعذر تحميل الأحياء.");return result.data.zones}
export const listAdminDeliveryZones=()=>adminApi<DeliveryZone[]>("/api/admin/delivery-zones");
export const createDeliveryZone=(data:Pick<DeliveryZone,"name"|"deliveryFee"|"isActive"|"sortOrder">)=>adminApi<{id:string;message:string}>("/api/admin/delivery-zones",{method:"POST",body:JSON.stringify(data)});
export const updateDeliveryZone=(id:string,data:Partial<Pick<DeliveryZone,"name"|"deliveryFee"|"isActive"|"sortOrder">>)=>adminApi<{message:string}>(`/api/admin/delivery-zones/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify(data)});
export const deleteDeliveryZone=(id:string)=>adminApi<{message:string}>(`/api/admin/delivery-zones/${encodeURIComponent(id)}`,{method:"DELETE"});