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
import TranslationstudioConfiguration from "utils/TranslationstudioConfiguration";

export type TranslationHistory = {
    "element-uid": string;
    "element-name": string;
    "target-language": string;
    "time-updated": number;
    "time-requested": number;
    "time-intranslation": number;
    "time-imported": number;
}

export async function ApiHistory(key: string, space: string, entry: string, env: string)
{
    if (space === "" || entry === "" || env === "" || key === "")
        throw new Error("Bad input");
    
    const res = await fetch(TranslationstudioConfiguration.URL + "/translationstudio/history/element", {
        method: "POST",
        cache: "no-cache",
        headers:{
            'Content-Type': 'application/json',
            'X-translationstudio': 'translationstudio'
        },
        body: JSON.stringify({	
			license: key,
            space: space,
            entry: entry,
            env: env
		})
    });

    if (res.ok)
    {
        const js = await res.json();
        if (js && Array.isArray(js))
            return js as TranslationHistory[];
        else
            return [];
    }

    const err = await res.json();
    throw new Error("Could not fetch history: " + (err.message ?? "no reason given"));
}