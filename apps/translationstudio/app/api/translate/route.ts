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
import { TranslationRequest } from "interfaces/translationstudio";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAlreadyValidatedSessionCookieData } from "utils/AuthUtils";
import TranslationstudioConfiguration from "utils/TranslationstudioConfiguration";

export const dynamic = "force-dynamic";

export async function POST(req:Request)
{
	const cookieStore = await cookies();
	const data = await getAlreadyValidatedSessionCookieData(cookieStore);
	if (data === null || !data.token)
	{
		return NextResponse.json({ message: "Access impossible" }, {
			status: 401
		});
	}

    try
	{
        const payload:TranslationRequest = await req.json();
		if (data.space !== payload.spaceid)
			throw new Error("Invalid space");
		
		const res = await fetch(TranslationstudioConfiguration.URL + "/translate", {
			method: "POST",
			cache: "no-cache",
			headers:{
				'Content-Type': 'application/json',
				'Authorization': data.token
			},
			body: JSON.stringify(payload)
		});

		if (res.ok)
			return new Response(null, { status: 204 });

		const json = await res.json();
		if (json.message)
			throw new Error(json.message)
	}
	catch (err:any)
	{
		console.error(err.message);
	}

    return NextResponse.json({ message: "Could not submit translation" }, {
        status: 500
    });
}