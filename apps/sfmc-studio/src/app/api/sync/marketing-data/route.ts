import { syncMarketingCloudData } from "@/controllers/data-sync/marketing-cloud";
import { ApiResponses } from "@/lib/helpers/ApiResponses";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    let {
      licenseKey,
      sfmcSubdomain,
      sfmcclientId,
      sfmcclientSecret,
      sfmcTimezone,
    } = requestBody;

    if (!sfmcSubdomain || !sfmcclientId || !sfmcclientSecret)
      throw "Invalid Credential";

    const syncRes = await syncMarketingCloudData(requestBody);

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
