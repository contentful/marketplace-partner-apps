import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../test/utils/testUtils";
import { AboutView } from "./AboutView";
import { APP_DISPLAY_NAME, APP_VERSION } from "../../utils/appMeta";
import {
  MARKUP_DEVELOPER_PORTAL_URL,
  MARKUP_STATUS_URL,
  MARKUP_SUPPORT_URL,
  MARKUP_TERMS_URL,
} from "../../utils/markupUrls";

describe("AboutView (panel variant — default)", () => {
  it("renders the user-facing app name and version", () => {
    const { getAllByText, getByText } = render(<AboutView onBack={vi.fn()} />);
    // The display name appears in the hero heading and the Integration card row.
    expect(getAllByText(APP_DISPLAY_NAME).length).toBeGreaterThan(0);
    expect(getByText(`Version ${APP_VERSION}`)).toBeInTheDocument();
  });

  it("shows the integration metadata card with the user-facing app name (not the npm package)", () => {
    const { getByText, getAllByText, queryByText } = render(<AboutView onBack={vi.fn()} />);
    expect(getByText("Integration")).toBeInTheDocument();
    // App row uses APP_DISPLAY_NAME, never the internal npm package identifier.
    expect(getAllByText(APP_DISPLAY_NAME).length).toBeGreaterThan(0);
    expect(queryByText("markup-ai-contentful-app")).toBeNull();
    expect(getByText("Contentful")).toBeInTheDocument();
  });

  it("renders the four useful links with external href + target", () => {
    const { getByText } = render(<AboutView onBack={vi.fn()} />);
    const expected = [
      { label: "Docs", href: MARKUP_DEVELOPER_PORTAL_URL },
      { label: "Support", href: MARKUP_SUPPORT_URL },
      { label: "Status", href: MARKUP_STATUS_URL },
      { label: "Terms", href: MARKUP_TERMS_URL },
    ];
    for (const { label, href } of expected) {
      const anchor = getByText(label).closest("a");
      expect(anchor).not.toBeNull();
      expect(anchor).toHaveAttribute("href", href);
      expect(anchor).toHaveAttribute("target", "_blank");
    }
  });

  it("calls onBack when the back IconButton is clicked", () => {
    const onBack = vi.fn();
    const { getByRole } = render(<AboutView onBack={onBack} />);
    fireEvent.click(getByRole("button", { name: /^back$/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("AboutView (page variant)", () => {
  it("renders a 'Back to configuration' text button instead of an icon-only back", () => {
    const onBack = vi.fn();
    const { getByRole, queryByRole } = render(<AboutView variant="page" onBack={onBack} />);
    expect(getByRole("button", { name: /back to configuration/i })).toBeInTheDocument();
    // No icon-only "Back" button on the page variant.
    expect(queryByRole("button", { name: /^back$/i })).toBeNull();
  });

  it("calls onBack when the back-to-configuration button is clicked", () => {
    const onBack = vi.fn();
    const { getByRole } = render(<AboutView variant="page" onBack={onBack} />);
    fireEvent.click(getByRole("button", { name: /back to configuration/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the hero badges (version + Contentful integration)", () => {
    const { getByText } = render(<AboutView variant="page" onBack={vi.fn()} />);
    expect(getByText(`v${APP_VERSION}`)).toBeInTheDocument();
    expect(getByText(/contentful integration/i)).toBeInTheDocument();
  });

  it("still surfaces integration metadata, browser info, and useful links", () => {
    const { getByText } = render(<AboutView variant="page" onBack={vi.fn()} />);
    expect(getByText("Integration")).toBeInTheDocument();
    expect(getByText("Browser")).toBeInTheDocument();
    expect(getByText("Useful links")).toBeInTheDocument();
    for (const label of ["Docs", "Support", "Status", "Terms"]) {
      expect(getByText(label).closest("a")).not.toBeNull();
    }
  });
});
