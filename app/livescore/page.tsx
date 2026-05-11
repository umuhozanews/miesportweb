export const dynamic = "force-dynamic";
import { ScoresPage } from "./ScoresPage";

type Props = { searchParams: Promise<{ date?: string }> };

export default async function FootballPage({ searchParams }: Props) {
  const { date } = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  return <ScoresPage sport="football" date={date ?? today} basePath="/livescore" />;
}
