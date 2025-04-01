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
import { ApiResponse, LanguageMapping, TranslationRequest } from "../interfaces/translationstudio";

export const postAuthenticate = (key: string, space:string): Promise<Response> => {

	return fetch("/api/authenticate", {
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
};


export const validateLicense = (key: string): Promise<Response> => {

	return fetch("/api/validate", {
		method: "POST",
		cache: "no-cache",
		headers:{
			'Content-Type': 'application/json',
			'X-translationstudio': 'translationstudio'
		},
		body: JSON.stringify({
			license: key
		})
	});
};


export const getHistoryForElement = ({ space, entry }: { space: string; entry: string; }): Promise<ApiResponse<History[]>> => {
	return fetch(`/api/history?space=${space}&entry=${entry}`, {
		cache: "no-cache",
		headers:{
			'X-translationstudio': 'translationstudio'
		}
	});
};

export const getHistory = ({ project, key }: { project: number; key: string }): Promise<ApiResponse<History[]>> => {
	return fetch("/api/history", {
		cache: "no-cache",
		headers:{
			'X-translationstudio': 'translationstudio'
		}
	});
};


export async function getLanguages() {

	const res = await fetch("/api/mappings", {
		cache: "no-cache",
		headers:{
			'X-translationstudio': 'translationstudio'
		}
	});

	if (!res.ok)
		return [];

	const json:LanguageMapping[] = await res.json();
	return json;
};

export const postTranslation = async (payload: TranslationRequest) => {

	try
	{
		const res = await fetch("/api/translate", {
			method: "POST",
			cache: "no-cache",
			headers:{
				'Content-Type': 'application/json',
				'X-translationstudio': 'translationstudio'
			},
			body: JSON.stringify(payload)
		});

		if (res.ok)
			return true;

		const json = await res.json();
		if (json.message)
			throw new Error(json.message)
	}
	catch (err:any)
	{
		console.error(err.message ?? err);
	}

	return false;
};