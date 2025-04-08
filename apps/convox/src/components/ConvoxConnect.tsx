import { Form, FormControl, HelpText, TextInput, TextLink, ValidationMessage } from "@contentful/f36-components";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useState } from "react";
import { IConvoxConnectProps } from "../customTypes/IConvoxConnectProps";
import { CONVOX_REFERENCE_URLS } from "../constants"
import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/css";

const styles = {
    helpCard: css({
        backgroundColor: tokens.gray100,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingS,
        marginTop: tokens.spacingM,
        marginBottom: tokens.spacingM
    }),
    helpText: css({
        marginBottom: tokens.spacingM,
        '&:last-child': {
            marginBottom: 0
        }
    }),
    textLink: css({
        color: tokens.blue600,
        fontWeight: tokens.fontWeightDemiBold,
        '&:hover': {
            textDecoration: 'underline'
        }
    })
};
export default function ConvoxConnect({ convoxDeployKey, updateconvoxDeployKey, isAuthenticated, hasAuthError }: IConvoxConnectProps) {
    const [inputValue, setInputValue] = useState(convoxDeployKey);

    const debouncedUpdate = useCallback(
        debounce((value: string) => {
            updateconvoxDeployKey(value);
        }, 500),
        [updateconvoxDeployKey]
    );

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        setInputValue(value);
        debouncedUpdate(value);
    };

    useEffect(() => {
        setInputValue(convoxDeployKey);
    }, [convoxDeployKey]);


    return (
        <>
            <Form>
                <FormControl marginBottom="spacingM">
                    <FormControl.Label>Convox Deploy Key</FormControl.Label>
                    <TextInput type="password" value={inputValue} onChange={handleInputChange}
                        isInvalid={!isAuthenticated && hasAuthError}
                    />
                    {!isAuthenticated && hasAuthError && <ValidationMessage>Invalid Deploy Key.</ValidationMessage>}
                    <div className={styles.helpCard}>
                        <HelpText className={styles.helpText}>
                            To generate a <strong>Deploy Key</strong>, please navigate to the <TextLink
                                icon={<ExternalLinkIcon />}
                                alignIcon="end"
                                href={CONVOX_REFERENCE_URLS.CONVOX_CONSOLE}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.textLink}>
                                Convox Console
                            </TextLink>{' '}<strong>Settings</strong> page and select Create under the Deploy Key section.
                        </HelpText>

                        <HelpText className={styles.helpText}>
                            You can find full configuration details in the{' '}
                            <TextLink
                                icon={<ExternalLinkIcon />}
                                alignIcon="end"
                                href={CONVOX_REFERENCE_URLS.CONVOX_CONTENTFUL_DOCUMENTATION}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.textLink}>
                                Convox Documentation
                            </TextLink>{' '}, or for video guides, {' '}<TextLink
                                icon={<ExternalLinkIcon />}
                                alignIcon="end"
                                href={CONVOX_REFERENCE_URLS.CONVOX_ACADEMY}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.textLink}>
                                Convox Academy Playlist.
                            </TextLink>
                        </HelpText>
                    </div>
                </FormControl>
            </Form>
        </>
    )
}
