import { RestaurantView } from "@/features/public-data/restaurant-view";
export default async function RestaurantDetailsPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RestaurantView id={id} />; }
