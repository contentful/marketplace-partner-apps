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
import { Tabs } from "@contentful/f36-components";
import NoKey, { IsLoading, TranslationstudioLogo } from "../NoKey";
import History from "../History";

// Hooks
import { useSDK } from "@contentful/react-apps-toolkit";


// SDK
import { PageAppSDK } from "@contentful/app-sdk";
import { ConnectorMap, SelectedConnector } from "../Types";
import { ApiHistorySpace, TranslationHistory } from "utils/api/ApiHistory";
import { ApiLanguageMappings } from "utils/api/ApiLanguageMappings";
import Translations from "../Translations";

const getEntryHistory = async (key: string, space: string) => {
	try {
		const res = await ApiHistorySpace(key, space);
		for (const elem of res)
		{
			const uid = elem["element-uid"];
			const l = uid.indexOf("|");
			const r = uid.lastIndexOf("|");
			if (l > 0 && r > l)
				elem["element-uid"] = elem["element-uid"].substring(l+1,r);
		}
		return res;
	}
	catch (err: any) {
		console.warn(err.message ?? err);
	}

	return [];
};

const getLanguageMapping = async (key: string, space: string) => {
	try {
		const json = await ApiLanguageMappings(key, space);
		if (json.length > 0)
			return json;
	}
	catch (err: any) {
		console.warn(err.message ?? err);
	}

	return [];
};

// Component
const Dashboard = () => {

	// Contentfull SDK
	const sdk = useSDK<PageAppSDK>();

	// State
	const [languageMapping, setLanguageMappings] = useState<ConnectorMap | null>(null);
	const [history, setHistory] = useState<TranslationHistory[]>([]);
	const [selectedTranslation, setSelectedTranslation] = useState<SelectedConnector>({ id: "", machineTranslation: false, urgent: false });
	const [isReady, setIsReady] = useState(false);

	const [currentTab, setCurrentTab] = useState('history');

	const space = sdk.ids.space;
	const key = sdk.parameters.installation.translationStudioKey ?? "";

	useEffect(() => {

		getLanguageMapping(key, space)
			.then((data) => {
				if (data && data.length > 0) {
					const map: ConnectorMap = {};
					for (let _d of data)
						map[_d.id] = _d;

					setLanguageMappings(map)
					setSelectedTranslation({
						id: data[0].id,
						machineTranslation: data[0].machine === true,
						urgent: data[0].machine === true
					});
				}

				return getEntryHistory(key, space);
			})
			.then((hdata) => setHistory(hdata))
			.catch((err: any) => {
				sdk.notifier.error("translationstudio is not available. Please check your license.");
				console.error(err.message ?? err);
			})
			.finally(() => setIsReady(true));

	}, [key, space, sdk, setLanguageMappings, setHistory, setSelectedTranslation, setIsReady]);


	if (!isReady)
		return <IsLoading fullWidth={true} />
	else if (!key)
		return <NoKey fullWidth={true} />;

	return (
		<div style={{ padding: "2em"}}>
			<div style={{ textAlign: "center", paddingBottom: "2em"}}>
				<TranslationstudioLogo />
			</div>
			<Tabs currentTab={currentTab} onTabChange={setCurrentTab}>
				<Tabs.List>
					<Tabs.Tab panelId="history">
						Translation History
					</Tabs.Tab>
					<Tabs.Tab panelId="translate" isDisabled={languageMapping === null}>
						Translate content
					</Tabs.Tab>
				</Tabs.List>
			</Tabs>
			{currentTab === "history" && (<History history={history} />)}
			{currentTab === "translate" && languageMapping !== null && (<Translations history={history} languageMapping={languageMapping} selectedTranslation={selectedTranslation}  />)}

		</div>
	);
};

export default Dashboard;
