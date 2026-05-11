export const dynamic = "force-dynamic";
import { ScoresPage } from "../ScoresPage";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function BasketballPage({ searchParams }: Props) {
  const { date } = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  return <ScoresPage sport="basketball" date={date ?? today} basePath="/livescore/basketball" />;
}
