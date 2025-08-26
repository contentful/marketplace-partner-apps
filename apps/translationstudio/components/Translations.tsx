import { LocalesAPI, PageAppSDK } from "@contentful/app-sdk";
import { ConnectorMap, SelectedConnector } from "./Types";
import { useSDK } from "@contentful/react-apps-toolkit";
import React from "react";
import { Badge, Box, Button, Card, Flex, Heading, Modal, Paragraph, Stack, Table, Text, Tooltip } from "@contentful/f36-components";
import { Spinner } from '@contentful/f36-components';
import { Checkbox } from '@contentful/f36-components';
import TranslationPane from "./TranslationPane";
import { SelectedEntries } from "interfaces/translationstudio";
import { ExternalLinkIcon, InfoCircleIcon } from '@contentful/f36-icons';
import { TranslationHistory } from "utils/api/ApiHistory";
import { getAvailableLanguages, buildValidLanguageMap } from "utils/LanguageUtils";
import RenderInformation from "utils/RenderInformation";

type ContentTypeItem = any;

type ContentTypeMapEntry = {
    translatable: boolean;
    item: ContentTypeItem;
    name: string;
    titleField: string;
}


type ContentTypeMap = {
    [id: string]: ContentTypeMapEntry
}

type TranslatableContentType = {
    id: string;
    name: string;
    titleField: string;
}

type PublishStatus = string;
type ContentfulEntry = {
    id: string;
    title: string;
    updatedAt: string;
    env: string;
    contenttype: string;
    publishedCounter: number;
    version: number;
    publishStatus: {
        [language:string]: PublishStatus;
    }
}

interface ContentTypeField {
    id: string;
    localized?: boolean;
}

const createEntryLink = function (space: string, uuid: string) {
    return `https://app.contentful.com/spaces/${space}/entries/${uuid}`;
}

const hasLocalizedFields = function (list: ContentTypeField[]) {
    if (!Array.isArray(list) || list.length === 0)
        return false;

    for (const field of list) {
        if (field.localized === true)
            return true;
    }

    return false;
}

const createContentTypeMap = function (items: any[]) {
    const res: ContentTypeMap = {};
    for (const item of items) {
        if (item.sys.id && item.fields && item.fields.length > 0) {
            res[item.sys.id] = {
                translatable: hasLocalizedFields(item.fields),
                item: item,
                name: item.name,
                titleField: item.displayField ?? ""
            }
        }
    }

    for (const item of items) {
        if (!item.sys.id)
            continue;

        const elem = res[item.sys.id];
        if (!elem || elem?.translatable === true || !item.items)
            continue;

        if (item.items.linkType !== "Entry" || !Array.isArray(item.items.validations) || item.items.validations.length === 0)
            continue;

        let isTranslatable = false;
        for (const validation of item.items.validations) {
            if (isTranslatable)
                break;

            if (!Array.isArray(validation.linkContentType) || validation.linkContentType.length === 0)
                continue;

            for (const type of validation.linkContentType) {
                if (res[type] && res[type].translatable === true) {
                    isTranslatable = true;
                    break;
                }
            }
        }

        if (isTranslatable)
            elem.translatable = true;
    }

    const data: TranslatableContentType[] = []
    for (const id in res) {
        if (res[id].translatable === true) {
            data.push({
                id: id,
                name: res[id].name,
                titleField: res[id].titleField
            })
        }
    }

    return data.sort((a, b) => a.name.localeCompare(b.name));
}

const RenderSpinner = function () {
    return <div style={{ paddingTop: "2em", textAlign: "center" }}>
        <Stack flexDirection="column">
            <Spinner variant="default" />
        </Stack>
    </div>
}

function getTypeLabel(type: string) {
    switch (type) {
        case "imported":
            return "translated";
        case "intranslation":
            return "in translation";
        default:
            return "queued";
    }
}
const getHistoryLabel = function (e: TranslationHistory) {
    const data: any = {
        sortable: 0,
        type: ""
    };
    if (e["time-imported"] > 0 && e["time-imported"] > e["time-intranslation"] && e["time-imported"] > e["time-requested"]) {
        data.sortable = e["time-imported"];
        data.type = "imported";
    }
    else if (e["time-intranslation"] > 0 && e["time-intranslation"] > e["time-imported"] && e["time-intranslation"] > e["time-requested"]) {
        data.sortable = e["time-intranslation"];
        data.type = "intranslation";
    }
    else if (e["time-requested"] > 0 && e["time-requested"] > e["time-imported"] && e["time-requested"] > e["time-intranslation"]) {
        data.sortable = e["time-requested"];
        data.type = "queued";
    }

    if (data.sortable === 0)
        return <></>;

    const date = new Date(data.sortable).toISOString();
    const pos = date.indexOf("T");
    const printDate = pos === -1 ? date : date.substring(0, pos);
    return <Stack>
        <Box style={{ width: "20%" }}>
            {e["target-language"]}
        </Box>
        <Box style={{ width: "79%" }}>
            {printDate} - {getTypeLabel(data.type)}
        </Box>
    </Stack>
}

const RenderHistoryInfo = function (props: { id: string, history: HistoryMap }) {
    const data = props.history[props.id];
    if (!data)
        return <></>;

    return <>
        {data.map((e, i) => <React.Fragment key={"hi" + e["element-uid"] + "-" + i}>{getHistoryLabel(e)}</React.Fragment>)}
    </>
}

const getFieldValue = function (item: any, defaultLocale: string) {
    const val = item[defaultLocale];
    if (val)
        return val;

    for (const key in item) {
        if (typeof item[key] === "string" && item[key] !== "")
            return item[key];
    }

    return "";
}

async function fetchAllEntries(sdk: PageAppSDK, space: string, id: string, displayField: string, defaultLocale: string, start = 0) {
    try {
        const response = await sdk.cma.entry.getMany({
            query: { content_type: id },
            spaceId: space
        });

        const data: ContentfulEntry[] = [];
        for (const entry of response.items) {
            const titleField = entry.fields[displayField];
            const title = !titleField ? "" : getFieldValue(titleField, defaultLocale);

            const status:any = {}
            if (entry.sys.fieldStatus)
            {
                const candidate = entry.sys.fieldStatus['*'];
                for (const lang in candidate)
                    status[lang] = candidate[lang];
            }

            data.push({
                id: entry.sys.id,
                title: title === "" ? "Untitled" : title,
                updatedAt: entry.sys.updatedAt,
                env: entry.sys.environment.sys.id,
                contenttype: id,
                publishedCounter: entry.sys.publishedCounter ?? 0,
                version: entry.sys.version,
                publishStatus: status
            })
        }
        return data;
    }
    catch (err) {
        console.error(err);
    }

    return null;
}

const formatDate = function (date: string) {
    if (date.length < 10)
        return date;

    // 2025-07-10T10:37:48.118Z
    const pos = date.indexOf("T");
    if (pos === -1)
        return date;

    const dot = date.lastIndexOf('.');
    const left = date.substring(2, pos);
    const right = date.substring(pos + 1, dot);
    return left + " " + right;
}

const RenderSelectContentTypeNoEntries = function (props: { has: boolean }) {
    if (props.has)
        return RenderInformation({ text: "No entries available" });

    return RenderInformation({ text: "Please select a content type" });
}

const RenderNoContentTypes = function () {
    return RenderInformation({ text: "There are no translatable content types available" });
}

type HistoryMap = {
    [uid: string]: TranslationHistory[]
}

const buildHistoryMap = function (history: TranslationHistory[]) {
    const res: HistoryMap = {};

    if (history.length === 0)
        return res;

    for (const ele of history) {
        const id = ele["element-uid"];
        if (!res[id])
            res[id] = [ele]
        else
            res[id].push(ele);
    }

    return res;
}

const getLanguageLabel = function (names: any, lang: string) {
    const elem = names[lang];
    if (elem)
        return elem + " (" + lang + ")";
    else
        return lang;
}

const StyleLocaleBadge = {
    margin: "0 1em",
    cursor: "default"
}

const RenderLocales = function (props: { languages: LocalesAPI }) {
    return <div style={{ textAlign: "center" }}>
        Available languages: <Badge variant={"primary"} style={StyleLocaleBadge}>{getLanguageLabel(props.languages.names, props.languages.default)}</Badge>
        {props.languages.available.filter(candidate => candidate !== props.languages.default).sort().map(e => <Badge key={"lang" + e} variant={"secondary"} style={StyleLocaleBadge}>{getLanguageLabel(props.languages.names, e)}</Badge>)}
    </div>

}

export default function Translations(props: { languageMapping: ConnectorMap, selectedTranslation: SelectedConnector, history: TranslationHistory[] }) {
    const sdk = useSDK<PageAppSDK>();
    const space = sdk.ids.space;
    const defaultLocale = sdk.locales.default;
    const [languageMappings, setLanguageMappings] = React.useState<ConnectorMap>({});

    const historyMap = buildHistoryMap(props.history);
    const [pending, setPending] = React.useState(true);
    const [contentTypes, setContentTypes] = React.useState<TranslatableContentType[]>([]);
    const [entries, setEntries] = React.useState<ContentfulEntry[]>([]);
    const [selectedEntries, setSelectedEntries] = React.useState<SelectedEntries>({})
    const [isFetching, setIsFetching] = React.useState(false);
    const [currentContentType, setCurrentContentType] = React.useState<{ id: string, name: string }>({ id: "", name: "" });
    const [viewDetails, setViewDetails] = React.useState<ContentfulEntry|null>(null);

    React.useEffect(() => {

        const languageList = getAvailableLanguages(sdk.locales.available, sdk.locales.default);
        setLanguageMappings(buildValidLanguageMap(props.languageMapping, languageList));

        sdk.cma.contentType.getMany({}).then(res => {
            if (res.items && Array.isArray(res.items) && res.items.length > 0) {
                const types = createContentTypeMap(res.items);
                setContentTypes(types);
            }

        }).catch((err) => {
            console.error(err);
            sdk.notifier.error("Could not load content types");
        })
            .finally(() => setPending(false));
    }, [sdk, props.languageMapping, setContentTypes, setPending, setLanguageMappings]);


    if (pending) {
        return <RenderSpinner />
    }

    if (contentTypes.length === 0) {
        return <RenderNoContentTypes />
    }

    const loadEntriesByContentType = function (id: string, name: string, titleField: string) {
        setIsFetching(true);
        setSelectedEntries({});
        fetchAllEntries(sdk, space, id, titleField, defaultLocale).then(res => {
            if (res === null)
                throw new Error("Cannot fetch entries");

            console.log(res)
            setEntries(res);
            setCurrentContentType({ id: id, name: name })
        }).catch((err) => {
            setEntries([]);
            console.error(err);
            sdk.notifier.error("Could not load entries for content type " + name);
        })
            .finally(() => setIsFetching(false));
    }

    const hasSelectedAll = function () {
        return entries.length > 0 && entries.length === Object.keys(selectedEntries).length;
    }

    const doSelectAll = function () {
        if (hasSelectedAll()) {
            setSelectedEntries({});
            return;
        }

        const res: any = {}
        for (const e of entries)
            res[e.id] = e.title;

        setSelectedEntries(res);
    }

    const RenderTranslationPane = function () {
        if (Object.keys(selectedEntries).length === 0)
            return <></>;

        if (Object.keys(languageMappings).length === 0) {
            if (Object.keys(props.languageMapping).length === 0)
                return <RenderInformation text="There are no translation settings configured for this space." />

            return <RenderInformation text="Translation settings are not applicable to this space. Languages do not match" />
        }

        const email = sdk.user.email ?? "";
        const license = sdk.parameters.installation.translationStudioKey ?? "";

        return <Box style={{ width: '250px' }} >
            <Card>
                <TranslationPane
                    keepUnusableEntries={true}
                    entries={selectedEntries}
                    languageMapping={languageMappings}
                    space={sdk.ids.space}
                    app={sdk.ids.app}
                    email={email}
                    license={license}
                    notifier={sdk.notifier}
                    environment={sdk.ids.environment}
                />
            </Card>
        </Box>
    }

    const RenderTable = function () {
        return <Table css={{ isSticky: true }}>
            <Table.Head>
                <Table.Row>
                    <Table.Cell>
                        <Checkbox
                            isChecked={hasSelectedAll()}
                            onChange={() => doSelectAll()}
                        />
                    </Table.Cell>
                    <Table.Cell>Name</Table.Cell>
                    <Table.Cell />
                    <Table.Cell>Id</Table.Cell>
                    <Table.Cell>Environment</Table.Cell>
                    <Table.Cell>Versions</Table.Cell>
                    <Table.Cell>Last update</Table.Cell>
                    <Table.Cell>Status</Table.Cell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {entries.map(e => <Table.Row key={e.id}>
                    <Table.Cell>
                        <Checkbox
                            value={e.id}
                            isChecked={selectedEntries[e.id] !== undefined || isFetching}
                            onChange={() => {
                                if (selectedEntries[e.id])
                                    delete selectedEntries[e.id];
                                else
                                    selectedEntries[e.id] = e.title;

                                setSelectedEntries({ ...selectedEntries });
                            }}
                        />
                    </Table.Cell>
                    <Table.Cell>{e.title}</Table.Cell>
                    <Table.Cell>
                        <a href={createEntryLink(space, e.id)} target="_blank" title="Open entry in a new tab or window"><ExternalLinkIcon size="small" /></a>
                    </Table.Cell>
                    <Table.Cell>{e.id}</Table.Cell>
                    <Table.Cell>{e.env}</Table.Cell>
                    <Table.Cell style={{ cursor: "pointer" }} onClick={() => setViewDetails(e)}>
                        {e.publishedCounter > 0 ? e.version : (<Badge variant="secondary">unpublished</Badge>)}
                    </Table.Cell>
                    <Table.Cell>{formatDate(e.updatedAt)}</Table.Cell>
                    <Table.Cell><RenderHistoryInfo id={e.id} history={historyMap} /></Table.Cell>
                </Table.Row>
                )}
            </Table.Body>
        </Table>
    }

    const RenderModalInformation = function()
    {
        if (viewDetails === null)
            return <></>
            
        const langs = Object.keys(viewDetails.publishStatus);
        if (langs.length === 0)
            return <></>;

        return <Modal onClose={() => setViewDetails(null)} isShown={viewDetails !== null}>
        {() => (
          <>
            <Modal.Header
              title={viewDetails.title}
              subtitle={viewDetails.publishedCounter > 0 ? "" : "unpublished"}
              onClose={() => setViewDetails(null)}
            />
            <Modal.Content>
              <Heading>
                Version details
              </Heading>
              <Paragraph>
                {langs.map((e,i) => <React.Fragment key={"modal-"+i}>{e} - {viewDetails.publishStatus[e]}<br/></React.Fragment>)}
              </Paragraph>
            </Modal.Content>
          </>
        )}
      </Modal>
  
    }

    return <>
        <RenderModalInformation />
        <Box style={{ marginTop: "2em" }}>
            <RenderLocales languages={sdk.locales} />
        </Box>
        <Box style={{ marginTop: "2em" }}>
            <Flex flexDirection="column" gap="spacingS">
                <Flex flexDirection="row" gap="spacingS">
                    <Box style={{ width: '200px' }} >
                        {contentTypes.map(e => <Button key={e.id}
                            style={{ marginBottom: "0.5em", justifyContent: "left" }}
                            onClick={() => loadEntriesByContentType(e.id, e.name, e.titleField)} isFullWidth={true}
                            isDisabled={currentContentType.id === e.id}>{e.name}</Button>
                        )}
                    </Box>
                    <Flex flexGrow={1}>
                        <Box style={{ width: "100%" }}>
                            {isFetching && (<RenderSpinner />)}
                            {!isFetching && entries.length === 0 && (<RenderSelectContentTypeNoEntries has={currentContentType.id !== ""} />)}
                            {!isFetching && entries.length > 0 && (<RenderTable />)}
                        </Box>
                    </Flex>
                    <RenderTranslationPane />
                </Flex>
            </Flex>
        </Box>
    </>;
}