import { css } from "@emotion/css";
import { VIDEO_PLAYER_MAX_SIZE } from "../utils/MetadataView";

export const videoPlayer = css({
    display: "block",
    width: "100%",
    maxWidth: VIDEO_PLAYER_MAX_SIZE + "px",
    border: 0,
});
