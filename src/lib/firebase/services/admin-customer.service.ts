import { adminApi } from "../admin-api";
import type { AccountStatus } from "@/types/auth";

export type AdminCustomerDate = string | null | { toDate: () => Date; toMillis?: () => number };
export type AdminCustomer = {
  uid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: "customer";
  status: AccountStatus;
  createdAt: AdminCustomerDate;
  updatedAt: AdminCustomerDate;
  lastLoginAt: AdminCustomerDate;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: AdminCustomerDate;
};

export const getAdminCustomers = () => adminApi<{ customers: AdminCustomer[]; total: number }>("/api/admin/customers");
export const getAdminCustomer = (id: string) => adminApi<{ customer: AdminCustomer | null }>(`/api/admin/customers/${encodeURIComponent(id)}`);
