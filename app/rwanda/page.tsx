export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getRPSeasons } from "@/lib/rwandapl";

export default async function RwandaRootPage() {
  const seasons = await getRPSeasons();
  const latest = seasons[0];
  if (latest) redirect(`/rwanda/${latest.id}`);
  redirect("/rwanda/81617");
}
