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
export type BadRequest = {
	code: "bad_request";
	message: string;
};

export type ApiResponse<T> =
	| Omit<Response, "json"> & {
			status: number;
			json: () => T | PromiseLike<T>;
	  };

export interface Languages {
	id: string;
	"display-name": string;
	"source-language": string;
	"target-languages": string[];
	"connector-id": string;
}

export type LanguageMapping = {
	"connector": string;
	"id": string;
	"limit-to-cms-projects": string[];
	"machine": boolean;
	"name": string;
	"quota": string;
	"source": string;
	"targets": string[];
}
export interface TranslationRequest {
	app_id?: string;
	apikey: string;
	email: string;
	duedate?: number;
	title: string;
	entry_uid: string;
	spaceid: string;
	urgent: boolean;
	environment: string;
	translations: {
		source: string;
		target: string;
		"connector": string;
	}[];
}

export interface History {
	element: string;
	type: number;
	"source-language": string;
	"target-language": string;
	"time-insert": number;
	"time-export": number;
	"time-intranslation": number;
	"time-translated": number;
}

export type SessionTokenData = {
    clientid: string;
    space: string;
    token: string;
}
