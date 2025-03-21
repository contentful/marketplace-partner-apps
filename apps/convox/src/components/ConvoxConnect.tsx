import { Form, FormControl, HelpText, TextInput, ValidationMessage } from "@contentful/f36-components";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useState } from "react";
import { IConvoxConnectProps } from "../customTypes/IConvoxConnectProps";


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
                    <HelpText>
                        <i>Deploy Keys can be generated from the <strong>Settings</strong> page in the Convox Console.</i>
                    </HelpText>
                </FormControl>
            </Form>
        </>
    )
}
