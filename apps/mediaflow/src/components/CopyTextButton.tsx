import { useEffect, useRef, useState } from "react";
import { IconButton, Tooltip } from "@contentful/f36-components";
import * as icons from "@contentful/f36-icons";
import tokens from "@contentful/f36-tokens";
import { visuallyHidden } from "./CopyTextButton.styles";

const COPIED_DURATION_MS = 1500;

/**
 * An icon button which copies a text to the clipboard and confirms it with a check mark
 *
 * @param text - The text to copy
 * @param label - What is copied, used in the aria-label, e.g. "CDN URL"
 */
export const CopyTextButton = ({ text, label }: { text: string; label: string }) => {
    const [isCopied, setIsCopied] = useState(false);
    const resetTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(resetTimeout.current), []);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch(error) {
            console.error("[ERROR] Could not copy to the clipboard: ", error);
            return;
        }
        setIsCopied(true);
        clearTimeout(resetTimeout.current);
        resetTimeout.current = setTimeout(() => setIsCopied(false), COPIED_DURATION_MS);
    };

    return (
        <>
            <Tooltip placement="top" content={ isCopied ? "Copied" : "Copy" }>
                <IconButton
                    size="small"
                    variant="transparent"
                    aria-label={ isCopied ? label + " copied" : "Copy " + label }
                    icon={ isCopied ? <icons.CheckIcon color={ tokens.green600 } /> : <icons.CopySimpleIcon /> }
                    onClick={ copy }
                />
            </Tooltip>
            <span role="status" className={ visuallyHidden }>{ isCopied ? label + " copied" : "" }</span>
        </>
    );
};
