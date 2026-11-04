import { videoPlayer as videoPlayerStyle } from "./VideoEmbed.styles";

/**
 * Displays the Mediaflow video player in an iframe. Renders nothing if there is no valid player URL.
 * The URL must come from getVideoPlayerSrc, which only accepts the Mediaflow player origin.
 *
 * @param playerSrc - The player URL, see getVideoPlayerSrc
 * @param aspectRatio - The CSS aspect-ratio of the player, see getVideoAspectRatio
 * @param maxWidth - The maximum width of the player in pixels, see getVideoPlayerMaxWidth
 */
export const VideoEmbed = ({ playerSrc, aspectRatio, maxWidth }: { playerSrc: string | null; aspectRatio: string; maxWidth?: number }) => {
    if(!playerSrc) {
        return null;
    }
    return (
        <iframe
            src={ playerSrc }
            title="Mediaflow video"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className={ videoPlayerStyle }
            style={{ aspectRatio, maxWidth: maxWidth ? maxWidth + "px" : undefined }}
        />
    );
};
