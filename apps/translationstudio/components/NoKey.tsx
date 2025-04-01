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
import { Paragraph } from "@contentful/f36-components";
import React from "react";
import { LOGO } from "utils/logo";
import { css } from "emotion";
import Image from "next/image";

export default function noKey()
{

    return <>
        <div style={{ textAlign: "center"}}>
            <Image src={LOGO} alt="" className={css({ height: "100px", width: "227px", display: "inline-block" })} />
        </div>
        <Paragraph>Please go to the App configuration and enter a valid translationstudio license</Paragraph>;
    </>
}
