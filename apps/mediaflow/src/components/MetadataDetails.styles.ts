import tokens from "@contentful/f36-tokens";
import { css } from "@emotion/css";

export const styles = {
    // The card has no padding; the accordion spans its full width with a rule above it
    accordion: css({ borderTop: `1px solid ${tokens.gray200}` }),
    filledCount: css({ marginLeft: "auto", color: tokens.gray600, fontWeight: "normal" }),
    emptyFieldsToggle: css({ borderRadius: "999px" }),
    sectionTitle: css({
        display: "block",
        marginBottom: tokens.spacingXs,
        fontSize: tokens.fontSizeS,
        fontWeight: tokens.fontWeightDemiBold,
        letterSpacing: tokens.letterSpacingWide,
        textTransform: "uppercase",
        color: tokens.gray600,
    }),
    row: css({
        display: "grid",
        gridTemplateColumns: "150px minmax(0, 1fr)",
        columnGap: tokens.spacingM,
        alignItems: "center",
        padding: `${tokens.spacing2Xs} 0`,
    }),
    label: css({ color: tokens.gray600 }),
    value: css({ color: tokens.gray900, overflowWrap: "anywhere" }),
    technicalValue: css({
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontFamily: tokens.fontStackMonospace,
        color: tokens.gray900,
    }),
    missing: css({ fontStyle: "italic", color: tokens.gray600 }),
    technicalRow: css({ minWidth: 0 }),
};
