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
import { Box, Button, Caption, Checkbox, IconButton, Menu, Paragraph, Radio } from "@contentful/f36-components";
import { MenuIcon } from '@contentful/f36-icons';
import NoKey, { IsLoading, NoLanguageMappings } from "../../components/NoKey";

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
			<Paragraph>Please note: you plan might not include translation histories.</Paragraph>
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

const VIEW_TRANSLATION = 1;
const VIEW_HISTORY = 2;

type ConnectorMap = {
	[id:string]:LanguageMapping
}

type SelectedConnector = {
	id: string;
	machineTranslation: boolean;
	urgent: boolean;
}

// Component
const Sidebar = () => {

	// Contentfull SDK
	const sdk = useSDK<SidebarAppSDK>();

	// State
	const [languageMapping, setLanguageMappings] = useState<ConnectorMap|null>(null);
	const [history, setHistory] = useState<TranslationHistory[]>([]);
	const [selectedTranslation, setSelectedTranslation] = useState<SelectedConnector>({ id: "", machineTranslation: false, urgent: false });
	const [dueDate, setDueDate] = useState<string>("");
	const [sendEmail, setSendEmail] = useState(true);
	const [pending, setPending] = useState(false);
	const [isReady, setIsReady] = useState(false);
	const [viewType, setViewType] = useState(VIEW_TRANSLATION)

	const entry = sdk.ids.entry;
	const space = sdk.ids.space;
	const app = sdk.ids.app;
	const email = sdk.user.email;
	const titleField = sdk.contentType.displayField;
	const title = sdk.entry.fields[titleField]?.getValue() ?? entry;
	const key = sdk.parameters.installation.translationStudioKey ?? "";
	
	
	useEffect(() => {
		
		postAuthenticate(key, space).then((res) => {
			if(!res.ok)
				throw new Error("Invalid license");

			return getLanguageMapping();
		})
		.then((data) => {
			if (data && data.length > 0)
			{
				const map:ConnectorMap = {};
				for (let _d of data)
					map[_d.id] = _d;

				setLanguageMappings(map)
				setSelectedTranslation({
					id: data[0].id,
					machineTranslation: data[0].machine === true,
					urgent: data[0].machine === true
				});
			}
			
			return getEntryHistory(space, entry, sdk.ids.environment);
		})
		.then((hdata) => setHistory(hdata))
		.catch((err:any) => {
			sdk.notifier.error("translationstudio is not available. Please check your license.");
			console.error(err.message ?? err);
		})
		.finally(() => setIsReady(true));
		
	}, [entry, key, space, sdk, setLanguageMappings, setHistory, setSelectedTranslation, setIsReady]);

	
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
		setSelectedTranslation({
			id: selectedTranslation.id,
			machineTranslation: selectedTranslation.machineTranslation,
			urgent: e.target.checked
		})
	};

	const handleCheckboxMail: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setSendEmail(e.target.checked);
	};

	// creates "translations" prop for the TS call
	const getTranslations = () => {

		const trans = languageMapping && selectedTranslation.id &&  languageMapping[selectedTranslation.id];
		if (!trans)
			return [];

		return trans["targets"].map((item) => ({
				source: trans["source"],
				target: item,
				"connector": trans["connector"]
			}));
	};

	const isUrgent = function()
	{
		return selectedTranslation.machineTranslation || selectedTranslation.urgent;
	}

	// actual TS request
	const translate = async () => {
		
		const translations = getTranslations() || [];
		if (translations.length === 0)
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
			email: selectedTranslation.machineTranslation || !sendEmail ? "" : email,
			duedate: urgent ? 0 : getDueDate(),
			translations: translations
		};
		setPending(true);
		try {
			const ok = await postTranslation(payload);
			if (ok) 
				sdk.notifier.success("Translation request sent.");
			else 
				sdk.notifier.error("Translation request could not be sent.");
		}
		finally {
			setPending(false);
		}
	};

	const onSelectLanguageMapping = function(id:string)
	{
		if (languageMapping === null)
			return;

		const elem = languageMapping[id];
		if (elem === undefined)
			return;

		setSelectedTranslation({
			id: id,
			machineTranslation: elem.machine === true,
			urgent: elem.machine === true
		});
	}

	const TranslationSettings = function()
	{
		if (languageMapping === null)
			return <></>;
		
		return <>
			<Paragraph>Translation Settings</Paragraph>
				<Box marginBottom="spacingM">
					{Object.keys(languageMapping).map((id, idx) => (
						<Radio onChange={() => onSelectLanguageMapping(id)} name="mappings" isChecked={id === selectedTranslation.id} value={id} key={id} defaultChecked={idx === 0}>
							{languageMapping[id]["name"]}
						</Radio>
					))}
				</Box>
				{!selectedTranslation.machineTranslation && (<>
					<Paragraph>Translation date</Paragraph>
					<DateInput onChange={setDate} value={dueDate} />
					<Checkbox name="urgent" isChecked={selectedTranslation.urgent} onChange={handleCheckbox}>
						Translate immediately and do not use quotes
					</Checkbox>
					<Checkbox name="email" isChecked={sendEmail} onChange={handleCheckboxMail}>
						Notify me by mail about the translation status
					</Checkbox>
				</>)}
				<Box style={{textAlign: "center", paddingBottom: "2em"}}>
					<Button variant="positive" style={{ width: "100%" }} isDisabled={pending} onClick={() => translate()} title={getButtonTitle(selectedTranslation.machineTranslation, selectedTranslation.urgent)}>
						{getButtonTitle(selectedTranslation.machineTranslation, selectedTranslation.urgent)}
					</Button>
				</Box>
			</>
	}

	const TranslationMenu = function() 
	{
		return <div style={{ position: "fixed", right: "10px", top: "0", zIndex: 2 }}>
				<Menu>
					<Menu.Trigger>
						<IconButton variant="secondary" icon={<MenuIcon />} aria-label="toggle menu" />
					</Menu.Trigger>
					<Menu.List>
						<Menu.Item onClick={() => setViewType(VIEW_TRANSLATION)}>Translate entry</Menu.Item>
						<Menu.Item disabled={history.length === 0} onClick={() => setViewType(VIEW_HISTORY)}>Translation history</Menu.Item>
					</Menu.List>
				</Menu>
			</div>
	}

	if (!isReady)
		return <IsLoading />
	else if (!key) 
		return <NoKey />;
	else if (languageMapping === null)
		return <NoLanguageMappings />

	return (
		<>
			<TranslationMenu />
			{viewType === VIEW_TRANSLATION && <TranslationSettings />}
			{viewType === VIEW_HISTORY && <ShowHistory history={history} /> }
		</>
	);
};

const getButtonTitle = function(machineTranslation:boolean, urgent:boolean)
{
	if (machineTranslation)
		return "Translate using ai service";
	else if (urgent)
		return "Translate immediately";
	else
		return "Request translation";
}

export default Sidebar;
