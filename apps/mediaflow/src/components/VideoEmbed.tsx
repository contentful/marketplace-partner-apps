import { useEffect, useRef } from "react";
import { videoWrapper as videoWrapperStyle } from "./VideoEmbed.styles";

/**
 * Displays a Mediaflow video player. This will only display anything if the embedMethod is either "iframe" or "javascript"
 *
 * @param embedCode - The embed code the file selector returned
 * @param embedMethod - Either "iframe" or "javascript"
 * @param maxWidth - The maximum width of the player in pixels, see getVideoPlayerMaxWidth
 */
export const VideoEmbed = ({ embedCode, embedMethod, maxWidth }: { embedCode?: string; embedMethod?: string; maxWidth?: number }) => {

    const videoWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(!videoWrapper || !videoWrapper.current) {
            console.warn("[WARNING] Cannot find video wrapper to display Mediaflow video");
            return;
        }
        const wrapper = videoWrapper.current;

        if(!embedCode || !embedMethod) {
            console.warn("[WARNING] Trying to display a video with either no embedCode or no embedMethod.");
            return;
        }

        if(embedMethod === "iframe") {
            wrapper.innerHTML = embedCode;
        } else if(embedMethod === "javascript") {
            wrapper.innerHTML = embedCode;
            const embedScript = wrapper.querySelector("script");
            if(!embedScript) {
                console.warn("[WARNING] The javascript embed code of the Mediaflow video contains no script");
                return;
            }
            wrapper.removeChild(embedScript);
            const newScript = document.createElement("script");
            newScript.textContent = embedScript.textContent;
            wrapper.appendChild(newScript);
        } else {
            console.warn("[WARNINGN] Trying to display a video with an invalid embedMethod");
            return;
        }
    }, [embedCode, embedMethod]);

    return <div ref={videoWrapper} className={videoWrapperStyle} style={maxWidth ? { maxWidth: maxWidth + "px" } : undefined}/>;
}
