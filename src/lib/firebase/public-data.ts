import { parseApiResponse } from "@/lib/api/response";
import { getRestaurantById } from "@/lib/api/public-restaurant.service";
import type { Category, Offer, Product, Restaurant } from "@/types";

type PublicRestaurantDto = { id:string;name:string;description:string;phone:string;address:string;logoUrl:string;coverUrl:string;deliveryTime:string;deliveryFee:number;minimumOrder:number;workingHours:string;isOpen:boolean;isActive:boolean;isFeatured:boolean;displayOrder:number };
type PublicProductDto = { id:string;restaurantId:string;categoryId:string;name:string;description:string;imageUrl:string;price:number;addons:Array<{id:string;name:string;price:number;isAvailable:boolean}> };
type PublicCategoryDto = { id:string;name:string;imageUrl:string;isActive:boolean;displayOrder:number };
type PublicOfferDto = { id:string;restaurantId:string;title:string;description:string;imageUrl:string;isActive:boolean };

async function publicApi<T>(url:string):Promise<T>{const response=await fetch(url,{cache:"no-store",headers:{Accept:"application/json"}});return parseApiResponse<T>(response,"تعذر تحميل البيانات. حاول مرة أخرى.")}
const mapRestaurant=(item:PublicRestaurantDto):Restaurant=>({id:item.id,name:item.name,description:item.description,image:item.coverUrl,logo:item.logoUrl,isOpen:item.isOpen,deliveryTime:item.deliveryTime,deliveryFee:item.deliveryFee,minimumOrder:item.minimumOrder,rating:0,category:"",popular:item.isFeatured,phone:item.phone,address:item.address,workingHours:item.workingHours,displayOrder:item.displayOrder});
const mapProduct=(item:PublicProductDto):Product=>({id:item.id,restaurantId:item.restaurantId,name:item.name,description:item.description,image:item.imageUrl,price:item.price,category:item.categoryId,addons:item.addons});
export async function loadPublicRestaurants(){const data=await publicApi<{restaurants:PublicRestaurantDto[]}>("/api/restaurants");return data.restaurants.map(mapRestaurant)}
export async function loadPublicRestaurant(id:string){const restaurant=await getRestaurantById(id);return mapRestaurant({...restaurant,workingHours:"",displayOrder:0})}
export async function loadPublicProducts(restaurantId:string){const data=await publicApi<{products:PublicProductDto[]}>(`/api/restaurants/${encodeURIComponent(restaurantId)}/products`);return data.products.map(mapProduct)}
export async function loadPublicProduct(id:string){const data=await publicApi<{product:PublicProductDto}>(`/api/products/${encodeURIComponent(id)}`);return mapProduct(data.product)}
export async function loadPublicCategories():Promise<Category[]>{const data=await publicApi<{categories:PublicCategoryDto[]}>("/api/categories");return data.categories.map(item=>({id:item.id,name:item.name,icon:"",image:item.imageUrl}))}
export async function loadPublicOffers():Promise<Offer[]>{const data=await publicApi<{offers:PublicOfferDto[]}>("/api/offers");return data.offers.map(item=>({id:item.id,title:item.title,description:item.description,restaurantId:item.restaurantId,image:item.imageUrl}))}
