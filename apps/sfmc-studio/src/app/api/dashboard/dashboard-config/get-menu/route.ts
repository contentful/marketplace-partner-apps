import { ApiResponses } from "@/lib/helpers/ApiResponses";
import connectDB from "@/lib/helpers/DBHelpers";
import { DashboardConfig } from "@/model/dashboardConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const requestBody = await req.json();

    const menuList = await DashboardConfig.find(
      {
        licenseKey: requestBody.licenseKey,
      },
      { __v: 0, licenseKey: 0 }
    ).sort({ order: 1 });

    return NextResponse.json(
      {
        data: menuList,
        message: "Menu list",
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
