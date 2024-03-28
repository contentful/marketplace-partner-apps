import { ConfigAppSDK } from "@contentful/app-sdk";
import { Button, Checkbox, Flex, Heading, ModalLauncher, Paragraph } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css, cx } from "emotion";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { appConfig } from "../../appConfig";
import tokens from "@contentful/f36-tokens";
import { colorGray } from "../../styles";
import { CheckCircleIcon, LockIcon } from "@contentful/f36-icons";
import { UseFormReturn, useForm, useWatch } from "react-hook-form";
import {
    ControlledCheckbox,
    ControlledSelect,
    ControlledTextInput,
    SelectOption,
    Divider,
} from "../../components";
import { ConnectModal, ConnectModalData, ConnectModalProps } from "./ConnectModal";
import { ContentTypeProps, SidebarItem } from "contentful-management";
import { useApi, useCollection, useSelected } from "../../hooks";

const { background, surface } = appConfig.locations.configScreen;

type SectionProps = {
    children: ReactNode;
    title: string;
    subtitle: string;
    isDisabled?: boolean;
};

// TODO: extract to separate file/folder and write storybook story
const Section = ({ children, title, subtitle, isDisabled }: SectionProps) => {
    return (
        <>
            <Flex flexDirection="column" gap="spacingXs">
                <Heading marginBottom="none" className={cx({ [colorGray]: isDisabled })}>
                    {title}
                </Heading>
                <Paragraph marginBottom="none" className={cx({ [colorGray]: isDisabled })}>
                    {subtitle}
                </Paragraph>
            </Flex>
            {children}
        </>
    );
};

export type AppInstallationParameters = {
    token: string;
    backendUrl: string;
    defaultProject: string;
    defaultTranslationJobName: string;
    sendRecursively: boolean;
};

export type ConfigScreenComponentProps = Pick<ConnectModalProps, "connect"> & {
    form: UseFormReturn<AppInstallationParameters>;
    connected: boolean;
    projectOptions?: SelectOption[];
    contentTypes?: ContentTypeProps[];
    selectedContentTypes: Set<string>;
    toggleSelectedContentTypes: (contentType: string) => void;
    toggleAllSelectedContentTypes: () => void;
};

export const ConfigScreenComponent = ({
    connect,
    form,
    connected,
    projectOptions,
    contentTypes,
    selectedContentTypes,
    toggleSelectedContentTypes,
    toggleAllSelectedContentTypes,
}: ConfigScreenComponentProps) => {
    const { control, setValue } = form;

    const isDisabled = !connected;

    const handleConnectPress = () => {
        ModalLauncher.open((props) => <ConnectModal {...props} connect={connect} />).then(
            (token?: string) => {
                if (!token) return;
                setValue("token", token);
            },
        );
    };

    return (
        <div className={css({ background, position: "fixed", inset: 0, overflow: "auto" })}>
            <Flex
                justifyContent="center"
                alignItems="flex-start"
                padding="spacingXl"
                className={css({ minHeight: "100%" })}
            >
                <Flex
                    flexDirection="column"
                    padding="spacingXl"
                    gap="spacingL"
                    className={css({
                        backgroundColor: surface,
                        boxShadow: tokens.boxShadowHeavy,
                        borderRadius: tokens.spacingXs,
                    })}
                >
                    <Section
                        title={`Connect ${appConfig.name}`}
                        subtitle={`Connect to your ${appConfig.name} account so you can trigger translation jobs in the Contentful Web App.`}
                    >
                        <Flex
                            flexDirection="column"
                            gap="spacingS"
                            alignSelf="center"
                            className={css({ width: "fit-content" })}
                        >
                            <Button variant="primary" onClick={handleConnectPress} isFullWidth>
                                Connect account
                            </Button>
                            <Paragraph
                                marginBottom="none"
                                className={cx(
                                    colorGray,
                                    css({
                                        padding: `0 ${tokens.spacingXs}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: tokens.spacing2Xs,
                                    }),
                                )}
                            >
                                {connected ? (
                                    <CheckCircleIcon variant="muted" />
                                ) : (
                                    <LockIcon variant="muted" />
                                )}
                                {connected
                                    ? "Succesfully connected to account"
                                    : "Connect account to make changes"}
                            </Paragraph>
                        </Flex>
                    </Section>
                    <Divider />
                    <Section
                        title="Configure defaults"
                        subtitle={`Requires a ${appConfig.name} account`}
                        isDisabled={isDisabled}
                    >
                        <ControlledSelect
                            disabled={isDisabled || !projectOptions}
                            control={control}
                            label="Project"
                            helpText={`Select the default ${appConfig.name} project to use`}
                            name="defaultProject"
                            options={projectOptions ?? []}
                        />
                        <ControlledTextInput
                            disabled={isDisabled}
                            control={control}
                            label="Translation job name"
                            helpText="Provide a default name for translation jobs"
                            name="defaultTranslationJobName"
                            isRequired
                        />
                        <ControlledCheckbox
                            disabled={isDisabled}
                            control={control}
                            label="Send all references recursively with entry"
                            name="sendRecursively"
                        />
                    </Section>

                    {contentTypes && contentTypes.length > 0 && (
                        <>
                            <Divider />
                            <Section
                                title="Add to sidebar views"
                                subtitle={`Assign ${appConfig.name} to content types`}
                                isDisabled={isDisabled}
                            >
                                <Flex flexDirection="column" gap="spacingS">
                                    {contentTypes.length > 1 && (
                                        <Checkbox
                                            isDisabled={isDisabled}
                                            isChecked={selectedContentTypes.size === contentTypes?.length}
                                            onChange={toggleAllSelectedContentTypes}
                                        >
                                            Select all content types ({contentTypes.length})
                                        </Checkbox>
                                    )}
                                    <Flex flexDirection="column" gap="spacingS" paddingLeft="spacingS">
                                        {contentTypes.map((contentType) => (
                                            <Checkbox
                                                isDisabled={isDisabled}
                                                key={contentType.sys.id}
                                                isChecked={selectedContentTypes.has(contentType.sys.id)}
                                                onChange={() =>
                                                    toggleSelectedContentTypes(contentType.sys.id)
                                                }
                                            >
                                                {contentType.name}
                                            </Checkbox>
                                        ))}
                                    </Flex>
                                </Flex>
                            </Section>
                        </>
                    )}
                </Flex>
            </Flex>
        </div>
    );
};

export const ConfigScreen = () => {
    const sdk = useSDK<ConfigAppSDK>();
    const form = useForm<AppInstallationParameters>({
        defaultValues: {
            backendUrl: "",
            token: "",
            defaultTranslationJobName: "",
            sendRecursively: false,
        },
    });
    const { handleSubmit, setValue, control, getValues } = form;
    const token = useWatch({ control, name: "token" });
    const backendUrl = useWatch({ control, name: "backendUrl" });
    const api = useApi(backendUrl);
    const fetchEditorInterfaces = useCallback(() => sdk.cma.editorInterface.getMany({}), []);
    const { items: editorInterfaces } = useCollection(fetchEditorInterfaces);
    const fetchContentTypes = useCallback(() => sdk.cma.contentType.getMany({}), []);
    const { items: contentTypes } = useCollection(fetchContentTypes);
    const { selected, setSelected, toggleSelected, toggleAllSelected } = useSelected(
        contentTypes?.map((contentType) => contentType.sys.id),
    );

    const [projectOptions, setProjectOptions] = useState<SelectOption[]>();

    const handleConfigure = useCallback(async () => {
        // This method will be called when a user clicks on "Install"
        // or "Save" in the configuration screen.
        // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

        if (!token) {
            sdk.notifier.error(`You need to connect to your ${appConfig.name} account.`);
            return false;
        }

        let data: AppInstallationParameters;
        try {
            data = await new Promise((resolve, reject) => {
                handleSubmit((data) => resolve(data), reject)();
            });
        } catch {
            sdk.notifier.error("Invalid input. Fix it before installing.");
            return false;
        }

        // Get current the state of EditorInterface and other entities
        // related to this app installation
        const currentState = await sdk.app.getCurrentState();

        return {
            // Parameters to be persisted as the app configuration.
            parameters: data,
            // In case you don't want to submit any update to app
            // locations, you can just pass the currentState as is
            targetState: currentState,
        };
    }, [sdk, handleSubmit, token]);

    const handleConfigurationCompleted = useCallback(async () => {
        if (!editorInterfaces) return;
        const updates = editorInterfaces.map(async (editorInterface) => {
            const contentTypeId = editorInterface.sys.contentType.sys.id;
            const isSelected = selected.has(contentTypeId);
            const isInstalled = Boolean(
                editorInterface.sidebar?.find((sidebarItem) => sidebarItem.widgetId === sdk.ids.app),
            );
            if (isSelected && !isInstalled) {
                // add to sidebar
                const sidebar: SidebarItem[] = editorInterface.sidebar ?? [
                    { settings: {}, widgetId: "publication-widget", widgetNamespace: "sidebar-builtin" },
                    { settings: {}, widgetId: "content-preview-widget", widgetNamespace: "sidebar-builtin" },
                    { settings: {}, widgetId: "incoming-links-widget", widgetNamespace: "sidebar-builtin" },
                    { settings: {}, widgetId: "translation-widget", widgetNamespace: "sidebar-builtin" },
                    { settings: {}, widgetId: "versions-widget", widgetNamespace: "sidebar-builtin" },
                ];
                await sdk.cma.editorInterface.update(
                    { contentTypeId },
                    {
                        ...editorInterface,
                        sidebar: [
                            { settings: {}, widgetId: sdk.ids.app, widgetNamespace: "app" },
                            ...sidebar,
                        ],
                    },
                );
            } else if (!isSelected && isInstalled) {
                // remove from sidebar
                await sdk.cma.editorInterface.update(
                    { contentTypeId },
                    {
                        ...editorInterface,
                        sidebar: editorInterface.sidebar?.filter(
                            (sidebarItem) => sidebarItem.widgetId !== sdk.ids.app,
                        ),
                    },
                );
            }
        });
        try {
            await Promise.all(updates);
        } catch {
            sdk.notifier.warning("Failed to update the sidebar of the selected content types");
        }
    }, [sdk, selected]);

    const connect = async (data: ConnectModalData) => {
        api.backendUrl = data.backendUrl;
        const token = await api.configs.create({
            appInstallationId: sdk.ids.app,
            locHubUrl: data.lochubUrl,
            locHubUsername: data.username,
            locHubPassword: data.password,
        });
        setValue("backendUrl", data.backendUrl);
        sdk.notifier.success(`Successfully connected to your ${appConfig.name} account.`);
        return token;
    };

    useEffect(() => {
        if (!token) return;
        api.projects
            .read({ generatedToken: token })
            .then((data) => {
                setProjectOptions(data.map((project) => ({ label: project.name, value: project.id })));
                // set default project if it was not loaded from app installation parameters, i.e. on first installation
                if (!getValues("defaultProject")) {
                    setValue("defaultProject", data[0].id);
                }
            })
            .catch(() => {
                sdk.notifier.error(
                    `Failed to load available projects from your ${appConfig.name} account. Please check the app configuration.`,
                );
            });
    }, [token]);

    useEffect(() => {
        if (!editorInterfaces) return;
        // All content types that already have the sidebar widget
        const contentTypeIds = editorInterfaces
            .filter(
                (editorInterface) =>
                    editorInterface.sidebar?.find((sidebarItem) => sidebarItem.widgetId === sdk.ids.app),
            )
            .map((editorInterface) => editorInterface.sys.contentType.sys.id);

        setSelected(new Set(contentTypeIds));
    }, [editorInterfaces]);

    useEffect(() => {
        // `onConfigure` allows to configure a callback to be
        // invoked when a user attempts to install the app or update
        // its configuration.
        sdk.app.onConfigure(handleConfigure);
        // `onConfigurationCompleted` allows to configure a callback to be
        // invoked when the app was installed or updated succesfully
        sdk.app.onConfigurationCompleted(handleConfigurationCompleted);
    }, [sdk, handleConfigure, handleConfigurationCompleted]);

    useEffect(() => {
        (async () => {
            // Get current parameters of the app.
            // If the app is not installed yet, `parameters` will be `null`.
            const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();

            if (currentParameters) {
                for (const name in currentParameters) {
                    setValue(
                        name as keyof AppInstallationParameters,
                        currentParameters[name as keyof AppInstallationParameters],
                    );
                }
            }

            // Once preparation has finished, call `setReady` to hide
            // the loading screen and present the app to a user.
            sdk.app.setReady();
        })();
    }, [sdk]);

    return (
        <ConfigScreenComponent
            connect={connect}
            form={form}
            connected={Boolean(token)}
            projectOptions={projectOptions}
            contentTypes={contentTypes}
            selectedContentTypes={selected}
            toggleSelectedContentTypes={toggleSelected}
            toggleAllSelectedContentTypes={toggleAllSelected}
        />
    );
};
