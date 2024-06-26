import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Systems running fine v3.",
  });
}
