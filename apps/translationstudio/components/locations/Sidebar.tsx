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
import { Box, Caption, IconButton, Menu, Paragraph } from "@contentful/f36-components";
import { MenuIcon } from '@contentful/f36-icons';
import NoKey, { IsLoading, NoLanguageMappings } from "../../components/NoKey";

// Hooks
import { useSDK } from "@contentful/react-apps-toolkit";

// Types
import type { SelectedEntries } from "../../interfaces/translationstudio";

// SDK
import { SidebarAppSDK } from "@contentful/app-sdk";
import { ConnectorMap } from "../Types";
import { ApiHistory, TranslationHistory } from "utils/api/ApiHistory";
import { ApiLanguageMappings } from "utils/api/ApiLanguageMappings";
import TranslationPane from "../TranslationPane";
import { getAvailableLanguages, buildValidLanguageMap } from "utils/LanguageUtils";

const getEntryHistory = async (key:string, space: string, entry: string, env:string) => {
	try {
		return await ApiHistory(key, space, entry, env);
	}
	catch (err:any)
	{
		console.warn(err.message ?? err);
	}

	return [];
};

const getLanguageMapping = async (key:string, space:string) => {
	try {
		const json = await ApiLanguageMappings(key, space);
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


// Component
const Sidebar = () => {

	// Contentfull SDK
	const sdk = useSDK<SidebarAppSDK>();

	// State
	const [languageMapping, setLanguageMappings] = useState<ConnectorMap|null>(null);
	const [history, setHistory] = useState<TranslationHistory[]>([]);
	const [isReady, setIsReady] = useState(false);
	const [viewType, setViewType] = useState(VIEW_TRANSLATION)

	const entry = sdk.ids.entry;
	const space = sdk.ids.space;
	const email = sdk.user.email;
	const titleField = sdk.contentType.displayField;
	const title = sdk.entry.fields[titleField]?.getValue() ?? entry;
	const key = sdk.parameters.installation.translationStudioKey ?? "";
	
	useEffect(() => {
		
		getLanguageMapping(key, space)
		.then((data) => {
			if (data && data.length > 0)
			{
				const map:ConnectorMap = {};
				for (let _d of data)
					map[_d.id] = _d;

				const languageList = getAvailableLanguages(sdk.locales.available, sdk.locales.default);
        		setLanguageMappings(buildValidLanguageMap(map, languageList));
			}
			
			return getEntryHistory(key, space, entry, sdk.ids.environment);
		})
		.then((hdata) => setHistory(hdata))
		.catch((err:any) => {
			sdk.notifier.error("translationstudio is not available. Please check your license.");
			console.error(err.message ?? err);
		})
		.finally(() => setIsReady(true));
		
	}, [entry, key, space, sdk, setLanguageMappings, setHistory, setIsReady]);

	const TranslationSettings = function()
	{
		if (languageMapping === null)
			return <></>;

		const selectedEntries:SelectedEntries = { }
		selectedEntries[sdk.ids.entry] = title;
		return <TranslationPane 
			keepUnusableEntries={false}
			entries={selectedEntries} 
			languageMapping={languageMapping} 
			space={sdk.ids.space} 
			app={sdk.ids.app} 
			email={email} 
			license={key} 
			notifier={sdk.notifier} 
			environment={sdk.ids.environment}  
		/>
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
		return <IsLoading fullWidth={false} />
	else if (!key) 
		return <NoKey fullWidth={false} />;
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

export default Sidebar;
