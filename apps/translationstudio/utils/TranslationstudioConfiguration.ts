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
const URL = process.env["REACT_APP_TRANSLATIONSTUDIO_API_URL"] ?? "";
const SECRET_HASH_AUTH = process.env["SECRET_HASH_AUTH"] ?? "";
const JWT_AUTHENTICATION_DURATION_MIN = parseInt(process.env["JWT_AUTHENTICATION_DURATION"] ?? "15");

if (URL === "" || SECRET_HASH_AUTH === "")
    throw new Error("NOT SETUP");

const TranslationstudioConfiguration = {
    URL: URL,
    SECRET: SECRET_HASH_AUTH,
    DURATION: JWT_AUTHENTICATION_DURATION_MIN
}

export default TranslationstudioConfiguration