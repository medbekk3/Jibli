import { adminApi } from "../admin-api";
export type AdminReportData={summary:{orders:number;sales:number;rejected:number;cancelled:number;newCustomers:number;newRestaurants:number};daily:{date:string;orders:number;sales:number}[];restaurants:{id:string;name:string;orders:number;sales:number}[];products:{id:string;name:string;quantity:number;total:number}[]};
export const getAdminReports=()=>adminApi<AdminReportData>("/api/admin/reports");
