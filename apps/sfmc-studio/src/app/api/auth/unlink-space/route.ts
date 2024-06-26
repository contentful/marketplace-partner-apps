import { unlinkSpaceId } from "@/controllers/auth/auth";
import { ApiResponses } from "@/lib/helpers/ApiResponses";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    const res = await unlinkSpaceId(requestBody);
    return NextResponse.json(
      {
        data: res?.data,
        message: res?.data?.message,
      },
      {
        status: res?.status,
        statusText: res?.statusText,
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message,
        message: "Something went wrong!",
      },
      ApiResponses.INTERNAL_SERVER_ERROR
    );
  }
}
