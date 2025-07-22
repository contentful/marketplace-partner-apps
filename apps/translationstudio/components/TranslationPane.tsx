import { SelectedEntries, TranslationRequestMultiple, TranslationRequestMultipleEntry } from "interfaces/translationstudio";
import { ConnectorMap, SelectedConnector } from "./Types";
import { Paragraph, Box, Radio, Checkbox, Button } from "@contentful/f36-components";
import { useState } from "react";
import { ApiTranslateMultiple } from "utils/api/ApiTranslate";
import DateInput from "./DateInput";
import { NotifierAPI } from "@contentful/app-sdk";

const getButtonTitle = function (machineTranslation: boolean, urgent: boolean) {
    if (machineTranslation)
        return "Translate using ai service";
    else if (urgent)
        return "Translate immediately";
    else
        return "Request translation";
}

const RenderIntroduction = function(props:{entries:SelectedEntries})
{
    const keys = Object.keys(props.entries);
    if (keys.length === 0)
        return <></>;

    if (keys.length === 1)
    {
        const entry = props.entries[keys[0]];
        return <Paragraph>Translate <b>{entry}</b> via</Paragraph>
    }
            
    return <Paragraph>Translate {keys.length} entries via</Paragraph>
}

export default function TranslationPane(props: { keepUnusableEntries:boolean, entries: SelectedEntries, languageMapping: ConnectorMap, space:string, app:string|undefined, email:string, license:string, notifier:NotifierAPI, environment: string }) {
    // State
    const [selectedTranslation, setSelectedTranslation] = useState<SelectedConnector>({ id: "", machineTranslation: false, urgent: false });
    const [dueDate, setDueDate] = useState<string>("");
    const [sendEmail, setSendEmail] = useState(true);
    const [pending, setPending] = useState(false);

    const space = props.space;
    const app = props.app;
    const email = props.email;
    const key = props.license ?? "";

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

        const trans = selectedTranslation.id && props.languageMapping[selectedTranslation.id];
        if (!trans)
            return [];

        return trans["targets"].map((item) => ({
            source: trans["source"],
            target: item,
            "connector": trans["connector"]
        }));
    };

    const isUrgent = function () {
        return selectedTranslation.machineTranslation || selectedTranslation.urgent;
    }

    // actual TS request
    const translate = async () => {

        const translations = getTranslations() || [];
        if (translations.length === 0) {
            props.notifier.error("Invalid langauge mapping found.");
            return;
        }

        const entries: TranslationRequestMultipleEntry[] = [];
        for (const id in props.entries) {
            entries.push({
                title: props.entries[id],
                entry_uid: id
            });
        }

        const urgent = isUrgent();
        const payload: TranslationRequestMultiple = {
            app_id: app,
            apikey: key, // Translation Studio Key
            environment: props.environment, // contentful space environment
            entries: entries,
            spaceid: space,
            urgent: urgent,
            email: selectedTranslation.machineTranslation || !sendEmail ? "" : email,
            duedate: urgent ? 0 : getDueDate(),
            translations: translations
        };
        setPending(true);
        try {
            const ok = await ApiTranslateMultiple(key, space, payload);
            if (ok)
                props.notifier.success("Translation request sent.");
            else
                props.notifier.error("Translation request could not be sent.");
        }
        finally {
            setPending(false);
        }
    };

    const onSelectLanguageMapping = function (id: string) {
        
        const elem = props.languageMapping[id];
        if (elem === undefined)
            return;

        setSelectedTranslation({
            id: id,
            machineTranslation: elem.machine === true,
            urgent: elem.machine === true
        });
    }

    /** This should not be necessary, but precaution is better than an unusable UI */
    if (Object.keys(props.languageMapping).length === 0)
        return <></>

    const showAdditionalInformation = props.keepUnusableEntries || (!selectedTranslation.machineTranslation && selectedTranslation.id !== "");
    const spaceToButton = showAdditionalInformation ? "2em 0" : "1em 0";
    return (
        <>
            <RenderIntroduction entries={props.entries} />
            <Box marginBottom="spacingM">
                {Object.keys(props.languageMapping).map((id, idx) => (
                    <Radio onChange={() => onSelectLanguageMapping(id)} name="mappings" isChecked={id === selectedTranslation.id} value={id} key={id} defaultChecked={idx === 0}>
                        {props.languageMapping[id]["name"]}
                    </Radio>
                ))}
            </Box>

            {showAdditionalInformation && (<>
                <Box style={{ padding: "1em 0" }}>
                    <Paragraph>Due date (optional)</Paragraph>
                    <DateInput onChange={setDate} value={dueDate} disabled={selectedTranslation.id === "" || selectedTranslation.machineTranslation} />
                </Box>
                <Box style={{ padding: "1em 0" }}>
                    <Checkbox name="urgent" isChecked={selectedTranslation.urgent} onChange={handleCheckbox} isDisabled={selectedTranslation.id === "" || selectedTranslation.machineTranslation}>
                        Translate immediately and ignore quotes
                    </Checkbox>
                    <Checkbox name="email" isChecked={sendEmail} onChange={handleCheckboxMail} isDisabled={selectedTranslation.id === "" || selectedTranslation.machineTranslation}>
                        Notify me by mail about the translation status
                    </Checkbox>
                </Box>
            </>)}

            <Box style={{ textAlign: "center", padding: spaceToButton }}>
                <Button variant="positive" 
                    style={{ width: "100%" }} 
                    isDisabled={pending || selectedTranslation.id === ""}
                    onClick={() => translate()} 
                    title={getButtonTitle(selectedTranslation.machineTranslation, selectedTranslation.urgent)}
                >
                    {getButtonTitle(selectedTranslation.machineTranslation, selectedTranslation.urgent)}
                </Button>
            </Box>
        </>
    );
}