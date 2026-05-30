export const dynamic = "force-dynamic";

export async function GET() {
  // Debug endpoint disabled in all environments — exposes internal scraping details.
  return new Response("Not found", { status: 404 });
}
