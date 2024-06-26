import { configureAutomation, updateClientCreds } from "@/controllers/app-config/app-config";
import { ApiResponses } from "@/lib/helpers/ApiResponses";
import { getSFMCToken } from "@/lib/helpers/SalesforceHelpers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    let access_token = await getSFMCToken({
      subdomain: requestBody.subdomain,
      credentials: {
        clientId: requestBody.client_id,
        clientSecret: requestBody.client_secret,
      },
    });

    await updateClientCreds(requestBody);

    const automationQuery = await configureAutomation({
      ...requestBody,
      access_token,
    });

    return NextResponse.json(
      {
        data: automationQuery,
        message: "Automation configured successfully",
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
