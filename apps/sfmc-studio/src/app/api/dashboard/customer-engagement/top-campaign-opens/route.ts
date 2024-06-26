import { getCampaignOpens } from "@/controllers/customer-engagement/customer-engagement";
import { ApiResponses } from "@/lib/helpers/ApiResponses";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const customerEngageRes = await getCampaignOpens(requestBody);

    return NextResponse.json(
      {
        data: customerEngageRes,
        message: "Customer Engagement data fetched succesfully.",
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
