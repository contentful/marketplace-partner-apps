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
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieData } from "utils/AuthUtils";
import { CreateSessionToken } from "utils/TokenFactory";
import TranslationstudioConfiguration from "utils/TranslationstudioConfiguration";

export const dynamic = "force-dynamic";

async function authenticate(key:string, space:string)
{
    const respose = await fetch(TranslationstudioConfiguration.URL + "/authenticate", {
		method: "POST",
        cache: "no-cache",
		headers:{
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			license: key,
            space: space
		})
	});

    if (respose.status === 200)
    {
        const json = await respose.json();
        if (json.token)
            return json.token as string;

        return "";
    }

    if (respose.status === 204)
    {
        console.warn("Unexpected result!");
        return "";
    }

    const json = await respose.json();
    console.warn("could not authenticate: ", respose.status, + ": ", json.message);
    return "";
}

async function hasValidSession(cookieStore:ReadonlyRequestCookies, clientid:string, space:string)
{
    if (!cookieStore.has("tssession"))
        return false;

    const data = await getSessionCookieData(cookieStore);
    if (data === null)
        return false;

    return data.clientid === clientid && data.space === space;
}

function getClientidFromLicense(jwt:string)
{
    const parts = jwt.split('.');
    if (parts.length !== 3)
        return null;

    const data = Buffer.from(parts[1], "base64").toString("utf8");
    try{
        const json = JSON.parse(data ?? "{}");
        if (json?.aud)
            return json?.aud as string
    }
    catch (err:any)
    {
        console.warn("Cannot decode jwt: " + (err.message ?? err));
    }

    return "";
}

export async function POST(request: Request)
{
    const json = await request.json();
    if (!json.license || !json.space)
    {
        return NextResponse.json({ message: "Invalid input" }, {
            status: 400
        });
    }

    const clientid = getClientidFromLicense(json.license);
    if (!clientid)
    {
        return NextResponse.json({ message: "Invalid license format" }, {
            status: 400
        });
    }

    const cookieStore = await cookies();
    if (await hasValidSession(cookieStore, clientid, json.space))
        return new Response(null, { status: 204 });

    const authBody = await authenticate(json.license, json.space);
    if (!authBody)
    {
        return NextResponse.json({ message: "Invalid license. Cannot authenticate." }, {
            status: 401
        });
    }

    const cookieValue = await CreateSessionToken(clientid, json.space, authBody);
    const response = new NextResponse(null, { status: 204 });
    response.cookies.set("tssession", cookieValue, {
        sameSite: "none",
        path: "/",
        httpOnly: true,
        secure: true,
        partitioned: true
    });

    return response;
}