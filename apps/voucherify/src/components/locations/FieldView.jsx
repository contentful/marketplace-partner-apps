import React, { useEffect } from "react";
import { useAutoResizer, useSDK } from "@contentful/react-apps-toolkit";
import { useState } from "react";
import { Table, Stack, TextLink, Button, Text, Pagination } from "@contentful/f36-components";
import { LinkIcon, ExternalLinkIcon, SearchIcon } from "@contentful/f36-icons";
import { unlinkEntryFromResource } from "../../api/updateResource";
import { fetchLinkedResources } from "../../api/fetchResources.js";
import SearchForm from "../SearchForm";
import { ITEMS_PER_PAGE } from "../../contentful-constants";
import PropTypes from "prop-types";
import { startCase } from "lodash";
const FieldView = ({ resourceType }) => {
    const sdk = useSDK();
    const { appId, secretKey, customURL } = sdk.parameters.installation.credentials;
    const { id: entryId } = sdk.entry.getSys();
    const [ resourcesLinkedToEntry, setResourcesLinkedToEntry ] = useState([]);
    const [ page, setPage ] = useState(0);
    const [ totalItems, setTotalItems ] = useState();
    const [ searchedResourceName, setSearchedResourceName ] = useState("");
    const [ showSearchComponent, setShowSearchComponent ] = useState(false);
    const [ refetchResources, setRefetchResources ] = useState(false);
    const resourceDisplayedName = startCase(resourceType);
    useAutoResizer();

    useEffect(() => {
        (async () => {
            try {
                const linkedResources = await fetchLinkedResources({ entryId, page: page + 1, appId, secretKey, customURL, searchQuery: searchedResourceName, resourceType });
                setResourcesLinkedToEntry(linkedResources.data);
                setTotalItems(linkedResources.total);
                setRefetchResources(false);
            } catch (error) {
                sdk.notifier.error(error.message);
            }
        })();
    }, [ page, searchedResourceName, refetchResources, appId, secretKey, customURL, entryId, resourceType, sdk.notifier ]);

    const openDialog = () => {
        sdk.dialogs
            .openCurrentApp({
                width                   : 600,
                shouldCloseOnEscapePress: true,
                parameters              : { entrySys: sdk.entry.getSys(), resourceType },
            })
            .then(async data => {
                if (data.action !== "added") {
                    return;
                }

                if (!data.success || !data?.resource?.id) {
                    sdk.notifier.error("Could not link entry to the resource.");
                    throw new Error("Could not link entry to the resource.");
                }

                const fieldValue = await sdk.field.getValue();

                const newResourceToLink = {
                    id  : data.resource.id,
                    name: data.resource.name
                };

                await sdk.field.setValue({
                    resources: (fieldValue?.resources || []).concat(newResourceToLink)
                });

                setSearchedResourceName("");
                setRefetchResources(true);
                setShowSearchComponent(false);
            });
    };

    const unlinkResource = resourceId => async () => {
        try {
            await unlinkEntryFromResource({ resourceId, entryId, appId, secretKey, customURL, resourceType });
            const fieldValue = await sdk.field.getValue();
            await sdk.field.setValue({
                resources: fieldValue.resources.filter(resource => resource.id !== resourceId),
            });

            setPage(0);
            setSearchedResourceName("");
            setRefetchResources(true);
            setShowSearchComponent(false);
            sdk.notifier.success(`Successfully unlinked entry with id: ${entryId} from resource with id: ${resourceId}`);
        } catch (error) {
            sdk.notifier.error(error.message);
        }
    };

    const toggleVisibilityOfSearchComponent = () => {
        setShowSearchComponent(prevState => !prevState);
    };

    const searchForResourceName = name => {
        setSearchedResourceName(name);
        setPage(0);
    };

    return (
        <Stack flexDirection="column" alignItems="start" style={{ padding: "1rem", border: "1px #eee solid", borderRadius: "7px", marginBottom: "2rem" }}>
            {resourcesLinkedToEntry?.length > 0 && <Button startIcon={<SearchIcon/>} size="small" onClick={toggleVisibilityOfSearchComponent}>Search linked {resourceDisplayedName}</Button>}
            {showSearchComponent && <SearchForm searchForResourceName={searchForResourceName}/>}
            {resourcesLinkedToEntry.length ? (
                <Table>
                    <Table.Body>
                        {resourcesLinkedToEntry.map(resource => (
                            <Table.Row key={resource.id}>
                                <Table.Cell>
                                    {resource.id ? (
                                        <TextLink
                                            style={{ fontSize: "15px" }}
                                            icon={<ExternalLinkIcon/>}
                                            alignIcon="start"
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {resource.name ? resource.name : resource.id}
                                        </TextLink>
                                    ) : (
                                        resource.name ? resource.name : resource.id
                                    )}
                                </Table.Cell>
                                <Table.Cell style={{ textAlign: "end", paddingRight: "25px" }}>
                                    <Button size="small"
                                        variant="negative"
                                        onClick={unlinkResource(resource.id)}
                                    >
                                        Remove
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            ) : <Text fontSize="fontSizeL">No {resourceDisplayedName} linked yet</Text>}
            {resourcesLinkedToEntry?.length > 0 &&
                <Pagination
                    activePage={page}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setPage}/>
            }
            <Button startIcon={<LinkIcon/>} size="small" variant="positive" onClick={openDialog}>
                Link {resourceDisplayedName}
            </Button>
        </Stack>
    );
};

FieldView.propTypes = {
    resourceType: PropTypes.string
};

export default FieldView;

