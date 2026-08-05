"use client";

import { Ban, CheckCircle2, FolderTree, Plus, ShoppingBag, Store, StoreIcon, Truck, Users, UtensilsCrossed, WalletCards } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminEmptyState, AdminLoadingSkeleton, AdminPageHeader, AdminStatCard, StatusBadge } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/format";
import { getAdminDashboardData, type AdminDashboardData } from "@/lib/firebase/services/admin-dashboard.service";
import { orderStatusLabel } from "@/lib/firebase/services/order.service";

export default function AdminPage() {
  const [data,setData]=useState<AdminDashboardData|null>(null); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
  const load=useCallback(async()=>{setLoading(true);setError("");try{setData(await getAdminDashboardData())}catch(error){setError(error instanceof Error?error.message:"تعذر تحميل بيانات لوحة الإدارة.")}finally{setLoading(false)}},[]);
  useEffect(()=>{void Promise.resolve().then(load)},[load]);
  const s=data?.stats;
  const cards=[
    {label:"عدد المطاعم",value:s?.restaurants??0,icon:Store},{label:"المطاعم النشطة",value:s?.activeRestaurants??0,icon:CheckCircle2},{label:"المطاعم المغلقة",value:s?.closedRestaurants??0,icon:Ban},
    {label:"عدد الأكلات",value:s?.products??0,icon:UtensilsCrossed},{label:"عدد التصنيفات",value:s?.categories??0,icon:FolderTree},{label:"عدد الزبائن",value:s?.customers??0,icon:Users},
    {label:"إجمالي الطلبات",value:s?.orders??0,icon:ShoppingBag},{label:"طلبات اليوم",value:s?.dailyOrders??0,icon:ShoppingBag},{label:"الطلبات الجديدة",value:s?.newOrders??0,icon:StoreIcon},
    {label:"الطلبات الجارية",value:s?.ongoingOrders??0,icon:Truck},{label:"الطلبات المكتملة",value:s?.completedOrders??0,icon:CheckCircle2},{label:"المرفوضة والملغاة",value:s?.rejectedOrCancelledOrders??0,icon:Ban},
    {label:"إجمالي المبيعات",value:formatPrice(s?.totalSales??0),icon:WalletCards},{label:"إجمالي رسوم التوصيل",value:formatPrice(s?.totalDeliveryFees??0),icon:WalletCards},
  ];
  const quick=[{href:"/admin/restaurants/add",label:"إضافة مطعم"},{href:"/admin/categories",label:"إضافة تصنيف"},{href:"/admin/products/add",label:"إضافة أكلة"},{href:"/admin/offers",label:"إضافة عرض"}];
  return <AdminShell title="الرئيسية"><AdminPageHeader title="لوحة الإدارة" description="إحصاءات فعلية ومراقبة الأنظمة المرتبطة في جيبلي" />
    {error&&<div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600"><span>{error}</span><button onClick={()=>void load()} className="rounded-lg bg-red-600 px-4 py-2 text-white">إعادة المحاولة</button></div>}
    {loading?<AdminLoadingSkeleton/>:data?<><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card=><AdminStatCard key={card.label}{...card}/>)}</section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><div className="space-y-6">
        <List title="أحدث الطلبات" items={data.latestOrders.map(item=>({id:item.id,name:item.orderNumber,detail:`${item.restaurantName} · ${orderStatusLabel(item.status)} · ${formatPrice(item.total)}`,active:item.status!=="rejected"&&item.status!=="cancelled",href:`/admin/orders/${item.id}`}))}/>
        <List title="أحدث المطاعم" items={data.latestRestaurants.map(item=>({id:item.id,name:item.name,detail:item.phone||"بدون هاتف",active:item.isActive,href:`/admin/restaurants/${item.id}`}))}/>
        <List title="أحدث الزبائن" items={data.latestUsers.filter(item=>item.role==="customer").map(item=>({id:item.uid,name:item.fullName||"بدون اسم",detail:item.phone||item.email||"—",active:item.status==="active",href:`/admin/customers/${item.uid}`}))}/>
      </div><div className="space-y-6"><section className="rounded-2xl border bg-white p-5"><h3 className="font-black">إجراءات سريعة</h3><div className="mt-4 grid gap-2">{quick.map(item=><Link key={item.href} href={item.href} className="flex h-11 items-center gap-2 rounded-xl bg-gray-50 px-4 text-sm font-bold hover:bg-orange-50 hover:text-primary"><Plus className="size-4"/>{item.label}</Link>)}</div></section>
        <List title="المطاعم الموقوفة" items={data.suspendedRestaurants.map(item=>({id:item.id,name:item.name,detail:"موقوف",active:false,href:`/admin/restaurants/${item.id}`}))}/>
        <section className="rounded-2xl border bg-white"><h3 className="border-b p-5 font-black">آخر النشاطات الإدارية</h3>{data.activityLogs.length?<div className="divide-y">{data.activityLogs.map(item=><div key={item.id} className="p-4"><p className="text-sm font-bold">{item.description}</p><p className="mt-1 text-xs text-gray-400">{item.entityType} · {item.action}</p></div>)}</div>:<AdminEmptyState title="لا توجد نشاطات مسجلة" description="ستظهر العمليات الإدارية الحساسة هنا."/>}</section>
      </div></section></>:null}</AdminShell>;
}
function List({title,items}:{title:string;items:{id:string;name:string;detail:string;active:boolean;href:string}[]}){return <section className="overflow-hidden rounded-2xl border bg-white"><h3 className="border-b p-5 font-black">{title}</h3>{items.length?<div className="divide-y">{items.map(item=><Link key={item.id} href={item.href} className="flex items-center justify-between p-4 hover:bg-gray-50"><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-gray-400">{item.detail}</p></div><StatusBadge active={item.active}/></Link>)}</div>:<p className="p-5 text-sm text-gray-400">لا توجد بيانات حالياً.</p>}</section>}
