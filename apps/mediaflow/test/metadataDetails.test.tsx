// @vitest-environment jsdom
import { test, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

/**
 * Tests the expandable MetadataDetails component
 */
import { MetadataDetails } from '../src/components/MetadataDetails';
import { buildMetadataSections } from '../src/utils/MetadataView';

afterEach(cleanup);

const sections = buildMetadataSections({
    id: 5555191,
    basetype: "image",
    filename: "DSCF8170.JPG",
    filetype: "jpg",
    url: "https://eu1.cdn.mediaflow.com/1/abc/DSCF8170.JPG",
    width: 800,
    height: 533,
    keywords: ["new york"],
});

const getToggle = () => screen.getByRole("button", { name: /all metadata/ });

test('Starts collapsed', () => {
    render(<MetadataDetails sections={ sections } />);
    expect(getToggle().getAttribute("aria-expanded")).toBe("false");
});

test('Shows how many fields are filled', () => {
    render(<MetadataDetails sections={ sections } />);
    expect(getToggle().textContent).toContain("6 of 12 fields filled");
});

test('Expands and changes its text on click', () => {
    render(<MetadataDetails sections={ sections } />);
    fireEvent.click(getToggle());
    expect([getToggle().getAttribute("aria-expanded"), getToggle().textContent.includes("Hide all metadata")]).toEqual(["true", true]);
});

// The Forma 36 accordion shows its panel in the next animation frame, so the tests wait for the panel's content
test('Hides empty fields until toggled', async () => {
    render(<MetadataDetails sections={ sections } />);
    fireEvent.click(getToggle());
    const showEmptyFields = await screen.findByRole("button", { name: "Show empty fields" });
    const before = screen.queryAllByText("Not added in Mediaflow yet").length;
    fireEvent.click(showEmptyFields);
    expect([before, screen.queryAllByText("Not added in Mediaflow yet").length > 0, !!screen.queryByRole("button", { name: "Hide empty fields" })]).toEqual([0, true, true]);
});

test('Copy button confirms that the value was copied', async () => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.resolve() }, configurable: true });
    render(<MetadataDetails sections={ sections } />);
    fireEvent.click(getToggle());
    fireEvent.click(await screen.findByRole("button", { name: "Copy ID" }));
    expect(await screen.findByRole("button", { name: "ID copied" })).toBeTruthy();
});
