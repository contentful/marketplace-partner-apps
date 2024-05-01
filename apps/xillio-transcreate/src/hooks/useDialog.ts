import { useContext } from "react";
import { OpenDialogContext } from "../providers";

export const useDialog = () => {
    const openDialog = useContext(OpenDialogContext);

    return {
        open: openDialog,
    };
};
