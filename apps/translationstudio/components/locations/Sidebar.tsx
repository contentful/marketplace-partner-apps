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
import React from "react";
import { useEffect, useState } from "react";

// Components
import { Box, Button, Caption, Checkbox, Paragraph, Radio } from "@contentful/f36-components";
import NoKey from "../../components/NoKey";

// Utils
import { getHistoryForElement, getLanguages, postAuthenticate, postTranslation } from "../../utils/translationstudio";

// Hooks
import { useSDK } from "@contentful/react-apps-toolkit";

// Types
import type { LanguageMapping, TranslationRequest } from "../../interfaces/translationstudio";

// SDK
import { SidebarAppSDK } from "@contentful/app-sdk";
import DateInput from "../../components/DateInput";
import { LOGO } from "utils/logo";
import Image from "next/image";
import { TranslationHistory } from "app/api/history/route";
import { listenerCount } from "process";

const getEntryHistory = async (space: string, entry: string, env:string) => {
	try {
		const response = await getHistoryForElement({ space, entry, env });
		if (response.status === 200) 
		{
			const data:TranslationHistory[] = await response.json();
			return data;
		}

		const error = await response.json();
		throw new Error(error.message);
	}
	catch (err:any)
	{
		console.warn(err.message ?? err);
	}

	return [];
};

const getLanguageMapping = async () => {
	try {
		const json = await getLanguages();
		if (json.length > 0)
			return json;
	}
	catch (err:any)
	{
		console.warn(err.message ?? err);
	}

	return [];
};

const PrintTable = function(props: { list:TranslationHistory[], field:string, title:string, key:string })
{
	if (props.list.length === 0)
		return <></>;

	return <table style={{ paddingBottom: "1em", width: "100%"}}>
		<thead>
			<tr>
				<th colSpan={2}>{props.title}</th>
			</tr>
  		</thead>
		<tbody>
			{props.list.map((e:any, i) => <tr key={props.key+i}>
				<td style={{ paddingRight: "1em"}}>{e["target-language"]}</td>
				<td>{new Date(e[props.field]).toLocaleString()}</td>
			</tr>)}
		</tbody>
	</table>
}

const ShowHistory = function(props:{ history:TranslationHistory[]})
{
	const imported:TranslationHistory[] = [];
	const intranslation:TranslationHistory[] = [];
	const waiting:TranslationHistory[] = [];

	props.history.forEach(e => {
		if (e["time-imported"] > 0 && e["time-imported"] > e["time-intranslation"] && e["time-imported"] > e["time-requested"])
			imported.push(e);
		else if (e["time-intranslation"] > 0 && e["time-intranslation"] > e["time-imported"] && e["time-intranslation"] > e["time-requested"])
			intranslation.push(e);
		else if (e["time-requested"] > 0 && e["time-requested"] > e["time-imported"] && e["time-requested"] > e["time-intranslation"])
			waiting.push(e);
	});

	if (imported.length === 0 && intranslation.length === 0 && waiting.length === 0)
	{
		return <Box marginTop="spacingM">
			<Caption>This entry has not been translated, yet.</Caption>
		</Box>
	}

	imported.sort((a, b) => b["time-imported"] - a["time-imported"]);
	intranslation.sort((a, b) => b["time-intranslation"] - a["time-intranslation"]);
	waiting.sort((a, b) => b["time-requested"] - a["time-requested"]);
	
	return <Box>
		<Paragraph>Translation History</Paragraph>
		<PrintTable key="imp" title="Translated and imported" field="time-imported" list={imported} />
		<PrintTable key="int" title="In translation" field="time-intranslation" list={intranslation} />
		<PrintTable key="wait" title="Queued/Not yet translated" field="time-requested" list={waiting} />
	</Box>
}

// Component
const Sidebar = () => {
	const today = new Date();

	// Contentfull SDK
	const sdk = useSDK<SidebarAppSDK>();

	// State
	const [languageMapping, setLanguageMappings] = useState<LanguageMapping[]>();
	const [history, setHistory] = useState<TranslationHistory[]>([]);
	const [selectedTranslation, setSelectedTranslation] = useState<number>(0);
	const [dueDate, setDueDate] = useState<string>("");
	const [urgent, setUrgent] = useState(false);
	const [machineTranslation, setMachineTranslation] = useState(false);
	const [sendEmail, setSendEmail] = useState(true);
	const [pending, setPending] = useState(false);

	const entry = sdk.ids.entry;
	const space = sdk.ids.space;
	const app = sdk.ids.app;
	const email = sdk.user.email;
	const titleField = sdk.contentType.displayField;
	const title = sdk.entry.fields[titleField]?.getValue() ?? entry;
	const key = sdk.parameters.installation.translationStudioKey;
	
	useEffect(() => {
		
		postAuthenticate(key, space).then((res) => {
			if(!res.ok)
				throw new Error("Invalid license");

			return getLanguageMapping();
		})
		.then((data) => {
			if (data && data.length > 0)
			{
				setLanguageMappings(data)
				if (data[0].machine === true)
				{
					setMachineTranslation(true);
					setUrgent(true);
				}
			}
			
			return getEntryHistory(space, entry, sdk.ids.environment);
		})
		.then((hdata) => setHistory(hdata))
		.catch((err:any) => {
			sdk.notifier.error("translationstudio is not available. Please check your license.");
			console.error(err.message ?? err);
		});
		
	}, [entry, key, space, sdk, setLanguageMappings, setHistory, setMachineTranslation, setUrgent]);

	// Show error if no TS key is available
	if (!key) return <NoKey />;

	const setDate = (event: { target: { value: React.SetStateAction<string> } }) => {
		setDueDate(event.target.value);
	};

	const getDueDate = (): number => {

		if (dueDate === "")
			return 0;

		const val = Date.parse(dueDate);
		return isNaN(val) ? 0 : val;
	};

	const handleCheckbox: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setUrgent(e.target.checked);
	};

	const handleCheckboxMail: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setSendEmail(e.target.checked);
	};

	// creates "translations" prop for the TS call
	const getTranslations = () => {
		const trans = languageMapping && languageMapping[selectedTranslation];
		return (
			trans &&
			trans["targets"].map((item) => ({
				source: trans["source"],
				target: item,
				"connector": trans["connector"]
			}))
		);
	};

	const isUrgent = function()
	{
		if (machineTranslation || urgent)
			return true;

		const trans = languageMapping && languageMapping[selectedTranslation];
		return trans ? trans.machine : false;
	}

	// actual TS request
	const translate = async () => {
		
		const res = getTranslations() || [];
		if (res.length === 0)
		{
			sdk.notifier.error("Invalid langauge mapping found.");
			return;
		}

		const urgent = isUrgent();
		const payload: TranslationRequest = {
			app_id: app,
			apikey: key, // Translation Studio Key
			environment: sdk.ids.environment, // contentful space environment
			entry_uid: entry, // UID of the entry
			title: title, // entry title
			spaceid: space,
			urgent: urgent,
			email: machineTranslation || !sendEmail ? "" : email,
			duedate: urgent ? 0 : getDueDate(),
			translations: getTranslations() || []
		};
		setPending(true);
		const ok = await postTranslation(payload);
		if (ok) 
			sdk.notifier.success("Translation request sent.");
		else 
			sdk.notifier.error("Translation request could not be sent.");
		setPending(false);
	};

	const onSelectLanguageMapping = function(idx:number)
	{
		if (languageMapping === undefined)
			return;

		const elem = languageMapping[idx];
		if (elem === undefined)
			return;

		setSelectedTranslation(idx);
		setMachineTranslation(elem.machine === true);
		setUrgent(elem.machine === true);
	}

	if (languageMapping === undefined || languageMapping.length === 0)
	{
		return <>
			<div style={{ textAlign: "right"}}>
				<Image src={LOGO} alt="" style={{ height: "50px", display: "inline-block" }} />
			</div>
			<Paragraph>You do not yet have any translation settings configured.</Paragraph>
			<Paragraph><a rel="nofollow" href="https://account.translationstudio.tech" target="_blank">translationstudio needs to be configured.</a></Paragraph>
		</>;
	}

	return (
		<>
			<Paragraph>Translation Settings</Paragraph>
			<Box marginBottom="spacingM">
				{languageMapping.map((item, idx) => (
					<Radio onChange={() => onSelectLanguageMapping(idx)} name="mappings" value={idx.toString()} key={idx} defaultChecked={idx === 0}>
						{item["name"]}
					</Radio>
				))}
			</Box>
			{!machineTranslation && (<>
				<Paragraph>Translation date</Paragraph>
				<DateInput onChange={setDate} value={dueDate} />
				<Checkbox name="urgent" isChecked={urgent} onChange={handleCheckbox}>
					Translate immediately and do not use quotes
				</Checkbox>
				<Checkbox name="email" isChecked={sendEmail} onChange={handleCheckboxMail}>
					Notify me by mail about the translation status
				</Checkbox>
			</>)}
			<Box style={{textAlign: "center", paddingBottom: "2em"}}>
				<Button variant="positive" style={{ width: "100%" }} isDisabled={pending} onClick={() => translate()} title={"Translate " + title + (isUrgent() ? "(urgent)" : "")}>
					Translate {urgent && " immediately"}
				</Button>
			</Box>
			<ShowHistory history={history} />
		</>
	);
};

export default Sidebar;
