/*
Contentful - translationstudio extension
Copyright (C) 2025 I-D Media GmbH, idmedia.com

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, see https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
*/
import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import { ValidateSessionToken } from "./TokenFactory";

export async function getSessionCookieData(cookieStore:ReadonlyRequestCookies)
{
    if (!cookieStore.has("tssession"))
    {
        console.warn("No session cookie. Cannot get session data");
        return null;
    }

    return await ValidateSessionToken(cookieStore.get("tssession")?.value ?? "");
}

export async function getAlreadyValidatedSessionCookieData(cookieStore:ReadonlyRequestCookies)
{
    if (!cookieStore.has("tssession"))
        return null;

    const jwt = cookieStore.get("tssession")?.value ?? "";
    const parts = jwt.split('.');
    if (parts.length !== 3)
        return null;

    const data = Buffer.from(parts[1], "base64").toString("utf8");
    if (!data)
        return null;

    try
    {
        const res:any = JSON.parse(data ?? "{}");
        if (res)
        {
            const space = res?.sub ?? "";
            const issuer = res?.iss ?? "";
            const clientid = res?.aud && !Array.isArray(res.aud) ? res?.aud : "";
            
            return {
                clientid: clientid,
                space: space,
                token: issuer
            }
        }
            
    }
    catch (err:any)
    {
        console.warn("Cannot parse jwt cookie:" + (err.message ?? err));
    }
    
    return null;
}
