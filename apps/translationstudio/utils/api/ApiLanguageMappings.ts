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
import { LanguageMapping } from "interfaces/translationstudio";
import TranslationstudioConfiguration from "utils/TranslationstudioConfiguration";

export async function ApiLanguageMappings(key:string, space:string)
{
    const res = await fetch(TranslationstudioConfiguration.URL + "/translationstudio/mappings", {
		method: "POST",
        cache: "no-cache",
		headers:{
			'Content-Type': 'application/json',
            'X-translationstudio': 'translationstudio'
		},
        body: JSON.stringify({	
			license: key,
            space: space
		})
	});

    if (!res.ok)
        throw new Error("Could not fetch data");
    
    const js:LanguageMapping[] = await res.json();
    return js;
}