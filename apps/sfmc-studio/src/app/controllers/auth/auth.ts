import { ApiClient } from "@/lib/ApiClients";
import {
  licenseKeyValidationEndpoint,
  unlinkSpaceIdEndpoint,
} from "@/lib/Constants";
import jwt from "jsonwebtoken";

export const validateLicenseKey = async ({
  spaceId,
  licenseKey,
}: {
  spaceId: string;
  licenseKey: string;
}) => {
  try {
    const secret = process.env.CTF_WEBSITE_INTEGRATION_SECRET ?? "";

    const token = jwt.sign({}, secret);
    const client = ApiClient();
    const res = await client.patch(
      licenseKeyValidationEndpoint,
      {
        licenseKey,
        spaceId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res;
  } catch (error: any) {
    return {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: { message: error?.response?.data?.message },
    };
  }
};

export const unlinkSpaceId = async ({ spaceId }: { spaceId: string }) => {
  try {
    const secret = process.env.CTF_WEBSITE_INTEGRATION_SECRET ?? "";

    const token = jwt.sign({}, secret);
    const client = ApiClient();
    const res = await client.patch(
      unlinkSpaceIdEndpoint,
      {
        spaceId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res;
  } catch (error: any) {
    return {
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      data: { message: error?.response?.data?.message },
    };
  }
};
