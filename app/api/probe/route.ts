// Debug probe — remove before production deploy
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
