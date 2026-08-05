import { adminApi } from "../admin-api";
export type SystemCheckData={firebaseClientConfigured:boolean;firebaseAdminConfigured:boolean;projectIdsMatch:boolean;authenticationReachable:boolean;firestoreReachable:boolean;cloudinaryConfigured:boolean;adminSessionValid:boolean;collections:Record<string,number>;incompleteDocuments:string[];indexes:string;checkedAt:string};
export const getAdminSystemCheck=()=>adminApi<SystemCheckData>("/api/admin/system-check");
