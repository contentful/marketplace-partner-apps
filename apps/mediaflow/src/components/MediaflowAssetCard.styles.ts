import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/css";
import type { MetadataStatus } from "../utils/MetadataView";

const STATUS_DOT_COLORS: Record<MetadataStatus["tone"], string> = {
    positive: tokens.green500,
    warning: tokens.orange500,
    negative: tokens.red600,
    neutral: tokens.gray500,
};

export const styles = {
    card: css({ padding: 0, overflow: "hidden" }),
    thumbnail: css({
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "128px",
        height: "168px",
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.gray100,
        overflow: "hidden",
    }),
    thumbnailImage: css({ width: "100%", height: "100%", objectFit: "contain" }),
    title: css({ fontSize: tokens.fontSizeL, fontWeight: tokens.fontWeightDemiBold, color: tokens.gray900, overflowWrap: "anywhere" }),
    muted: css({ color: tokens.gray600 }),
    summary: css({ color: tokens.gray600, overflowWrap: "anywhere" }),
    statusDot: css({ flexShrink: 0, width: "8px", height: "8px", borderRadius: "50%" }),
    shrinkable: css({ minWidth: 0 }),
};

export const statusDotTones = Object.fromEntries(
    Object.entries(STATUS_DOT_COLORS).map(([tone, color]) => [tone, css({ backgroundColor: color })])
) as Record<MetadataStatus["tone"], string>;
