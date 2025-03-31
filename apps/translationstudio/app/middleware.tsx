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
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers';
import { getSessionCookieData } from 'utils/AuthUtils';

const isSecuredRoute = function (uri: string) {
    return uri.startsWith("/api/");
}

const isSessionRoute = function (uri: string) {
    return !uri.startsWith("/api/validate")
        && !uri.startsWith("/api/authenticate");
}

const verifyApiRoutePreconditions = function()
{
    const head = headers();
    if (head.get("X-translationstudio") !== "translationstudio")
    {
        console.warn("X-translationstudio attribute is invalid");
        return false;
    }
    
    return true;
}

export async function middleware(request: NextRequest) {

    /** generic cross site scripting header evaluation to prevent CSRF calls to API */
    const uri = request.nextUrl.pathname.toLowerCase();
    if (!isSecuredRoute(uri))
        return NextResponse.next();

    if (!verifyApiRoutePreconditions())
        return NextResponse.json({ message: "Cannot grant access to api"}, { status: 401 });
        
    if (!isSessionRoute(uri))
        return NextResponse.next();

    const cookieStore = cookies();
    const data = await getSessionCookieData(cookieStore);
    if (data === null)
    {
        return NextResponse.json({ message: "Not a session-based request." }, {
            status: 401
        });
    }

    return NextResponse.next();
}