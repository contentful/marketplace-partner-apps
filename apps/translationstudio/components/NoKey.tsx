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

export function IsLoading()
{
    return <>
        <div style={{ textAlign: "center"}}>
            <Image height={50} width={116} src={LOGO} alt="" className={css({ height: "100px", width: "227px", display: "inline-block" })} />
        </div>
        <div style={{ paddingTop: "1.5em", textAlign: "center"}}>
            <Paragraph>translationstudio is loading</Paragraph>
        </div>
    </>    
}

export function NoLanguageMappings() 
{
    return <>
            <div style={{ textAlign: "right"}}>
                <Image height={50} width={116} src={LOGO} alt="" style={{ height: "50px", display: "inline-block" }} />
            </div>
            <div style={{ paddingTop: "1.5em", textAlign: "center"}}>
                <Paragraph>You do not yet have any translation settings configured.</Paragraph>
                <Paragraph>Please access your <a rel="nofollow" href="https://account.translationstudio.tech" target="_blank">translationstudio account</a>.</Paragraph>
            </div>
        </>;
}

export default function noKey()
{

    return <>
        <div style={{ textAlign: "center"}}>
            <Image height={50} width={116} src={LOGO} alt="" className={css({ height: "100px", width: "227px", display: "inline-block" })} />
        </div>
        <div style={{ paddingTop: "1.5em", textAlign: "center"}}>
            <Paragraph>Please go to the App configuration and enter a valid translationstudio license</Paragraph>;
        </div>
    </>
}
