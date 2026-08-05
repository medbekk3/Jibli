import type { Timestamp } from "firebase/firestore";

export type UserRole = "customer" | "restaurant" | "admin";
export type AccountStatus = "active" | "pending" | "suspended";

export type UserProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type SignUpData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
};

export const roleLabels: Record<UserRole, string> = {
  customer: "زبون",
  restaurant: "مطعم",
  admin: "إدارة",
};

export const statusLabels: Record<AccountStatus, string> = {
  active: "نشط",
  pending: "في انتظار الموافقة",
  suspended: "موقوف",
};
