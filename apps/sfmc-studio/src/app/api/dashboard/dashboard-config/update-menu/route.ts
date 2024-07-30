import { ApiResponses } from "@/lib/helpers/ApiResponses";
import connectDB from "@/lib/helpers/DBHelpers";
import { DashboardConfig } from "@/model/dashboardConfig";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const requestBody = await req.json();

    const menuList = await DashboardConfig.updateOne(
      {
        licenseKey: requestBody.licenseKey,
        _id: new mongoose.Types.ObjectId(requestBody._id),
      },
      {
        $set: {
          heading: requestBody.heading,
          menulabel: requestBody.menulable,
        },
      }
    );

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
