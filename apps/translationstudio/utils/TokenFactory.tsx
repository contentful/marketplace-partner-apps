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
'use server'

import { SessionTokenData } from 'interfaces/translationstudio';
import { SignJWT, jwtVerify } from 'jose'

const SECRET_HASH_AUTH = process.env["HASH_AUTHENTICATION"] ?? "" + Date.now();
const JWT_AUTHENTICATION_DURATION_MIN = parseInt(process.env["JWT_AUTHENTICATION_DURATION"] ?? "15");

export async function CreateSessionToken(clientid:string, space:string, authToken:string) {
    return new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer(authToken)
        .setAudience(clientid)
        .setSubject(space)
        .setExpirationTime(JWT_AUTHENTICATION_DURATION_MIN + "m")
        .sign(new TextEncoder().encode(SECRET_HASH_AUTH));
}

export async function ValidateSessionToken(token: string) {

    if (!token)
        return null;

    try {
        const verified = await jwtVerify(
            token,
            new TextEncoder().encode(SECRET_HASH_AUTH)
        )

        const data = verified.payload;
        const space = data?.sub ?? "";
        const issuer = data?.iss ?? "";
        const clientid = data?.aud && !Array.isArray(data.aud) ? data?.aud : "";
        
        return {
            clientid: clientid,
            space: space,
            token: issuer
        } as SessionTokenData;
    }
    catch (err:any) 
    {
        console.warn(err.message ?? err);
    }

    return null;
}
