import { getDCAuthToken } from "@/controllers/data-sync/sales-cloud";
import { ApiResponses } from "@/lib/helpers/ApiResponses";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    let {
      baseUrl,
      username,
      password,
      clientId,
      clientSecret,
      licenseKey,
      sfscTimezone,
    } = requestBody;

    if (!baseUrl || !username || !password || !clientId || !clientSecret)
      throw "Invalid Credential";

    const syncRes = await getDCAuthToken(requestBody);

    return NextResponse.json(
      {
        data: syncRes,
        message: "SF Data synchronisation hit succesfully.",
      },
      ApiResponses.SUCCESS
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
