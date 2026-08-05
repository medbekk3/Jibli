import { adminApi } from "../admin-api"; import type { AccountStatus,UserRole } from "@/types/auth"; import type { UserDocument } from "@/types/collections";
export type AdminUser=UserDocument&{authAccountExists?:boolean;firestoreDocumentExists?:boolean;authDisabled?:boolean|null};
export const getAdminUsers=()=>adminApi<AdminUser[]>("/api/admin/users");
export const getAdminUser=(id:string)=>adminApi<AdminUser>(`/api/admin/users/${id}`);
export const updateAdminUserStatus=(id:string,status:AccountStatus)=>adminApi<{message:string}>(`/api/admin/users/${id}/status`,{method:"PATCH",body:JSON.stringify({status})});
export const updateAdminUserRole=(id:string,role:UserRole)=>adminApi<{message:string}>(`/api/admin/users/${id}/role`,{method:"PATCH",body:JSON.stringify({role})});
export const createPasswordResetLink=(id:string,restaurantOnly=false)=>adminApi<{message:string;link:string}>(`/api/admin/users/${id}/reset-password`,{method:"POST",body:JSON.stringify({restaurantOnly})});
