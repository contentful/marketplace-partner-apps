import { css } from "@emotion/css";
import { VIDEO_PLAYER_MAX_SIZE } from "../utils/MetadataView";

export const videoWrapper = css({
    width: "100%",
    maxWidth: VIDEO_PLAYER_MAX_SIZE + "px",
    "& iframe, & video": {
        maxWidth: "100%",
    },
});
