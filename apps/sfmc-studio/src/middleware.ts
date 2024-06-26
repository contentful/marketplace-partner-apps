import { protectedRoutes } from "@/lib/Constants";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    // Check if the request method is POST
    if (request.method === "POST") {
      const parts = request.nextUrl.pathname.split("/");
      const route = parts[2];

      // Check if the route is a protected route
      if (protectedRoutes.includes(route)) {
        const response = await checkLicenseKey(request);
        if (!response.success) {
          return NextResponse.json(response);
        }
      }
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" });
  }

  // Continue to the next middleware or route handler
  return NextResponse.next();
}

const checkLicenseKey = async (request: NextRequest) => {
  try {
    const { licenseKey } = await request.json();

    if (!licenseKey) {
      return {
        success: false,
        message: "Please provide a license key.",
      };
    } else {
      return {
        success: true,
        message: "License key is valid.",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Error checking license key.",
    };
  }
};
