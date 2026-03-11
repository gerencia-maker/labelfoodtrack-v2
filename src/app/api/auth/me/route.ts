import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, unauthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorized();

  return NextResponse.json(user);
}
