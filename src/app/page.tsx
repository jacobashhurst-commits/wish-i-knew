import WishIKnewApp from "./wish-i-knew-app";
import { loadAppInitialData } from "@/lib/data/load-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialData = await loadAppInitialData();

  return <WishIKnewApp initialData={initialData} key={`${initialData.mode}-${initialData.childId ?? "none"}-${initialData.hasOnboarded}`} />;
}
