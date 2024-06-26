import { handleContentfulWebhook } from "@/controllers/webhooks/contentful";
import { ApiResponses } from "@/lib/helpers/ApiResponses";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
      const requestBody = await req.json();
  
      handleContentfulWebhook(requestBody)
  
      return NextResponse.json(
        {
          message: "Webhook processed successfully",
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