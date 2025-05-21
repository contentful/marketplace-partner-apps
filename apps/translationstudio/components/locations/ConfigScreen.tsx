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
import React, { useCallback, useState, useEffect } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import { Heading, Form, Button, Flex, Caption, SectionHeading, TextLink, Textarea } from "@contentful/f36-components";
import { css } from "emotion";
import { useSDK } from "@contentful/react-apps-toolkit";
import { validateLicense } from "../../utils/translationstudio";
import { LOGO } from "../../utils/logo";
import Image from "next/image";

export interface AppInstallationParameters {
	translationStudioKey?: string;
	fieldExceptions?: string;
}

const ConfigScreen = () => 
{
	const [parameters, setParameters] = useState<AppInstallationParameters>({});
	const sdk = useSDK<ConfigAppSDK>();

	const onConfigure = useCallback(async () => {
		const currentState = await sdk.app.getCurrentState();
		if (!parameters.translationStudioKey) 
		{
			sdk.notifier.error("Please provide a valid license.");
			return false;
		}
		
		return {
			parameters, // Parameters to be persisted as the app configuration.
			targetState: currentState
		};
	}, [parameters, sdk]);

	useEffect(() => {
		sdk.app.onConfigure(() => onConfigure());
	}, [sdk, onConfigure]);

	useEffect(() => {
		(async () => {
			// Get current parameters of the app.
			// If the app is not installed yet, `parameters` will be `null`.
			const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
			if (currentParameters) 
			{
				setParameters(currentParameters);
				currentParameters.translationStudioKey && (await keyCheck(currentParameters.translationStudioKey));
			}

			sdk.app.setReady();
		})();
	}, [sdk]);

	const [validKey, setValidKey] = useState(false);

	const keyCheck = async (key: string) => {
		if (!key) 
			return false;

		try 
		{
			const response = await validateLicense(key);
			const status = response.status === 204;
			setValidKey(status);
			return status;
		} 
		catch (e:any) 
		{
			console.error(e.message ?? e);
			return false;
		}
	};
	const onKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setValidKey(false);
		setParameters({ ...parameters, translationStudioKey: e.target.value });
	};

	const onKeyCheck = async () => {
		if (!parameters.translationStudioKey) return false;
		const valid = await keyCheck(parameters.translationStudioKey);
		if (valid) sdk.notifier.success("Thanks. The license is valid");
		else sdk.notifier.error("Sorry. The license is not valid");
	};
	
	return (
		<Flex flexDirection="column" className={css({ margin: "80px" })}>
			<div className={css({ textAlign: "center", marginBottom: "20px" })}>
				<Image width="227" height="100" src={LOGO} alt="" className={css({ display: "inline-block" })} />
			</div>
			<Form>
				<Heading>translationstudio license</Heading>
				<SectionHeading marginBottom="spacingXs">Pase your translationstudio license here</SectionHeading>
				<Flex className={css({ alignItems: "flex-start", marginBottom: "10px" })}>
					<Textarea
						className={css({ width: "100%", marginRight: "20px" })}
						placeholder="translationstudio License"
						name="translationStudioKey"
						id="translationStudioKey"
						rows={2}
						value={parameters.translationStudioKey || ""}
						onChange={onKeyChange}
						isRequired
					/>
					<Button variant="positive" isDisabled={!parameters.translationStudioKey || validKey} onClick={onKeyCheck}>Validate License</Button>
				</Flex>
				<Caption className={css({ textAlign: "center", display: "block" })}>
					You can obtain your translationstudio license from your account at <TextLink href="https://account.translationstudio.tech">https://account.translationstudio.tech</TextLink>. Further information is available at <TextLink href="https://github.com/translationstudio/contentful-extension">https://github.com/translationstudio/contentful-extension</TextLink>.
					<br/>For additional support, please contact us using your <TextLink href="https://account.translationstudio.tech">https://account.translationstudio.tech</TextLink> account.
				</Caption>
			</Form>

		</Flex>
	);
};

export default ConfigScreen;
