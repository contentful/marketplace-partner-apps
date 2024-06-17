import { BaseAppSDK, DialogAppSDK, OpenCustomWidgetOptions } from "@contentful/app-sdk";
import { Calendar } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { AppInstallationParameters } from "../ConfigScreen/ConfigScreen";
import tokens from "@contentful/f36-tokens";
import { css } from "emotion";
import { useEffect } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { TranslateDialog } from "./TranslateDialog";
import { MultiSelectOptions, SelectOption } from "../../components";
import { UpdateDialog } from "./UpdateDialog";

export type CalendarParameters = {
    type: "calendar";
    initialDate?: string;
};

export type ConfirmDialogParameters = {
    type: "confirm";
    title: string;
    message: string;
};

export type TranslateDialogParameters = {
    type: "translate";
    projectOptions: SelectOption[];
    selectedLocales?: string[];
};

export type UpdateDialogParameters = {
    type: "update";
    dueDate: string;
};

export type DialogInvocationParameters =
    | CalendarParameters
    | ConfirmDialogParameters
    | TranslateDialogParameters
    | UpdateDialogParameters;

export const Dialog = () => {
    const sdk = useSDK<DialogAppSDK<AppInstallationParameters, DialogInvocationParameters>>();

    const { defaultProject, defaultTranslationJobName, sendRecursively } = sdk.parameters.installation;

    useEffect(() => {
        sdk.window.startAutoResizer();
    }, [sdk]);

    if (sdk.parameters.invocation.type === "calendar") {
        const selected = sdk.parameters.invocation.initialDate
            ? new Date(sdk.parameters.invocation.initialDate)
            : undefined;

        return (
            <Calendar
                className={css({ padding: tokens.spacingM })}
                mode="single"
                selected={selected}
                onSelect={sdk.close}
                fromDate={new Date(Date.now() + 86400000)}
            />
        );
    }

    if (sdk.parameters.invocation.type === "confirm") {
        return <ConfirmDialog onClose={sdk.close} message={sdk.parameters.invocation.message} />;
    }

    if (sdk.parameters.invocation.type === "translate") {
        const localeOptions: MultiSelectOptions = { ...sdk.locales.names };
        delete localeOptions[sdk.locales.default];

        return (
            <TranslateDialog
                defaultValues={{
                    projectName: defaultProject,
                    sendRecursively,
                    submitter: sdk.user.email,
                    translationJobName: defaultTranslationJobName,
                    locales: sdk.parameters.invocation.selectedLocales ?? [],
                }}
                projectOptions={sdk.parameters.invocation.projectOptions}
                localeOptions={sdk.parameters.invocation.selectedLocales ? undefined : localeOptions}
                onClose={sdk.close}
            />
        );
    }

    if (sdk.parameters.invocation.type === "update") {
        return (
            <UpdateDialog
                defaultValues={{ dueDate: new Date(sdk.parameters.invocation.dueDate) }}
                onClose={sdk.close}
            />
        );
    }
};

type OpenCurrentAppOptions = Omit<
    OpenCustomWidgetOptions,
    "id" | "shouldCloseOnOverlayClick" | "shouldCloseOnEscapePress" | "parameters"
>;

export const openDialog = (sdk: BaseAppSDK, parameters: DialogInvocationParameters) => {
    const options = (): OpenCurrentAppOptions => {
        switch (parameters.type) {
            case "calendar":
                return { title: "Select a date", width: "small" };
            case "confirm":
                return { title: parameters.title, width: "medium" };
            case "translate":
                return { title: "Translate", width: "medium" };
            case "update":
                return { title: "Update", width: "medium" };
        }
    };
    return sdk.dialogs.openCurrentApp({
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
        parameters,
        ...options(),
    });
};
