import { css } from "@emotion/css";
import tokens from "@contentful/f36-tokens";

export const SEARCH_MAX_WIDTH = 520;

/**
 * All colors, spacing, radii, and type come from Forma 36 tokens so the app
 * matches the Contentful web app exactly.
 */
export const styles = {
  pageWrap: css({
    padding: tokens.spacingL,
    background: tokens.gray100,
    minHeight: "100vh",
    fontFamily: tokens.fontStackPrimary,
  }),

  pageHeader: css({
    maxWidth: 1100,
    margin: "0 auto",
    marginBottom: tokens.spacingM,
  }),

  panel: css({
    maxWidth: 1100,
    margin: "0 auto",
    background: tokens.colorWhite,
    border: `1px solid ${tokens.gray200}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingL,
    boxShadow: tokens.boxShadowDefault,
    overflow: "visible", // important: prevent popover clipping
  }),

  searchRow: css({ maxWidth: SEARCH_MAX_WIDTH }),

  sectionRule: css({
    height: 1,
    background: tokens.gray200,
    width: "100%",
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
  }),

  listContainer: css({
    border: `1px solid ${tokens.gray200}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: "hidden",
    background: tokens.colorWhite,
  }),

  treeBody: css({
    padding: tokens.spacingS,
  }),

  nodeRow: css({
    display: "grid",
    gridTemplateColumns: "18px 18px 1fr 28px 32px", // caret | icon | pill | info | action
    alignItems: "center",
    columnGap: tokens.spacingXs,
    padding: `${tokens.spacing2Xs} ${tokens.spacingXs}`,
    borderRadius: tokens.borderRadiusMedium,
    userSelect: "none",
    ":hover": { background: tokens.gray100 },
  }),

  caret: css({
    width: 18,
    height: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadiusSmall,
    cursor: "pointer",
    ":hover": { background: tokens.gray200 },
  }),

  caretSpacer: css({ width: 18, height: 18, display: "inline-block" }),

  pill: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingXs,
    padding: `${tokens.spacing2Xs} ${tokens.spacingS}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.gray200}`,
    background: tokens.colorWhite,
    minHeight: 34,
    width: "100%",
    cursor: "pointer",
    ":hover": { background: tokens.gray100 },
  }),

  pillDisabled: css({
    cursor: "default",
    opacity: 0.6,
  }),

  labelText: css({
    fontSize: tokens.fontSizeM,
    lineHeight: tokens.lineHeightM,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),

  rowAction: css({
    opacity: 0,
    transition: "opacity 120ms ease",
    ".nodeRow:hover &": { opacity: 1 },
  }),

  legendRow: css({
    display: "flex",
    gap: tokens.spacingS,
    alignItems: "center",
    flexWrap: "wrap",
  }),
};
