import { ReactNode, createContext } from "react";
import { DialogInvocationParameters, openDialog } from "../locations";
import { BaseAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";

export type OpenDialogContextType = (parameters: DialogInvocationParameters) => Promise<any>;

export const OpenDialogContext = createContext<OpenDialogContextType>(() => Promise.resolve());

export type OpenDialogProviderProps = {
    children?: ReactNode;
};

export const OpenDialogProvider = ({ children }: OpenDialogProviderProps) => {
    const sdk = useSDK();
    return (
        <OpenDialogContext.Provider value={openDialog.bind(null, sdk)}>{children}</OpenDialogContext.Provider>
    );
};
