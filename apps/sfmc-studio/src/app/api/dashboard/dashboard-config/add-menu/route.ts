import { ApiResponses } from "@/lib/helpers/ApiResponses";
import connectDB from "@/lib/helpers/DBHelpers";
import { defaultMenu } from "@/lib/utils/common";
import { DashboardConfig } from "@/model/dashboardConfig";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const requestBody = await req.json();
    let config;

    let existingMenuItemCount = await DashboardConfig.countDocuments({
      licenseKey: requestBody.licenseKey,
    });

    // delete all menu if count is not 4
    if (existingMenuItemCount < 4) {
      await DashboardConfig.deleteMany({
        licenseKey: requestBody.licenseKey,
      });
      let addedLicenseKey = defaultMenu.map((el) => {
        return { ...el, licenseKey: requestBody.licenseKey };
      });
      config = await DashboardConfig.insertMany(addedLicenseKey);
    }

    return NextResponse.json(
      {
        data: config,
        message: "Menu added to Dashboard",
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
