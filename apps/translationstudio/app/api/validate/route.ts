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
import { NextResponse } from "next/server";
import TranslationstudioConfiguration from "utils/TranslationstudioConfiguration";

export const dynamic = "force-dynamic";

async function isValidLicense(key:string)
{
    const respose = await fetch(TranslationstudioConfiguration.URL + "/validate", {
        method: "POST",
        cache: "no-cache",
        headers:{
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            license: key
        })
    });

    return respose.ok;
}

export async function POST(req: Request)
{
    const json = await req.json();
    if (!json.license)
    {
        return NextResponse.json({ message: "License missing" }, {
            status: 401
        });
    }

    if (!await isValidLicense(json.license))
    {
        return NextResponse.json({ message: "Invalid license" }, {
            status: 403
        });
    }

    return new Response(null, { status: 204 });
}