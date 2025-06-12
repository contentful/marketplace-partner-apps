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
import TranslationstudioConfiguration from "utils/TranslationstudioConfiguration";

export async function ApiTranslate(key:string, space:string, payload: TranslationRequest)
{
	try
	{

		if (space !== payload.spaceid)
			throw new Error("Invalid space");
		
		const res = await fetch(TranslationstudioConfiguration.URL + "/translationstudio/translate", {
			method: "POST",
			cache: "no-cache",
			headers:{
				'Content-Type': 'application/json',
				'X-translationstudio': 'translationstudio'
			},
			body: JSON.stringify({ 
				license: key,
				space: space,
				...payload })
		});

		if (!res.ok)
		{
			const json = await res.json();
			if (json.message)
				throw new Error(json.message)
		}

		return true;
	}
	catch (error:any)
	{
		console.error(error.message ?? error);
	}

	return false;
}