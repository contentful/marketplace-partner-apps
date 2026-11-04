import { test, expect, describe } from 'vitest';

/**
 * Tests the pure functions in MetadataView.ts
 */
import {
    isEmptyValue,
    formatValue,
    formatDimensions,
    formatFileSummary,
    isAltTextMissing,
    getKeywords,
    getPreviewUrl,
    getAssetIconType,
    buildMetadataSections,
    countFilledFields,
    getVisibleFields,
    getMetadataStatus,
    getVideoPlayerMaxWidth,
} from '../src/utils/MetadataView';
import type { MetadataField, MetadataSection } from '../src/utils/MetadataView';
import type { MediaflowFileData } from '../src/types';

const file = (data: Partial<MediaflowFileData>): MediaflowFileData => ({ id: 1, ...data });
const row = (id: string, isEmpty: boolean): MetadataField => ({ id, label: id, value: isEmpty ? "" : id, isEmpty, isTechnical: false });

const emptyImage: MediaflowFileData = {
    id: 5555191,
    basetype: "image",
    name: "DSCF8170",
    filename: "DSCF8170.JPG",
    filetype: "jpg",
    url: "https://eu1.cdn.mediaflow.com/1/abc/DSCF8170.JPG",
    width: 800,
    height: 533,
    description: "",
    altText: "",
    keywords: [],
    customFields: [],
};

const filledImage: MediaflowFileData = {
    ...emptyImage,
    altText: "A cat resting",
    description: "Cat after a long night",
    keywords: ["cat", "relax"],
    photographer: "Jane Doe",
    filesize: 2048,
    customFields: [
        { fieldId: 1, title: "Campaign", value: "Autumn" },
        { fieldId: 2, title: "Channels", value: ["Web", "Print"] },
        { fieldId: 3, title: "Approved by", value: "" },
    ],
};

const findSection = (sections: MetadataSection[], id: string): MetadataSection => sections.find(section => section.id === id) as MetadataSection;

describe('isEmptyValue', () => {
    test('Treats null, undefined, blank strings and empty arrays as empty', () => {
        expect([null, undefined, "", "   ", [], ["", " "]].every(isEmptyValue)).toBe(true);
    });

    test('Treats zero, false and filled values as filled', () => {
        expect([0, false, "x", ["x"]].some(isEmptyValue)).toBe(false);
    });
});

describe('formatValue', () => {
    test('Joins arrays with commas and skips blank items', () => {
        expect(formatValue(["Web", "", "Print"])).toBe("Web, Print");
    });

    test('Returns an empty string for empty values', () => {
        expect(formatValue(undefined)).toBe("");
    });
});

describe('formatFileSummary', () => {
    test('Combines type, dimensions and filename', () => {
        expect(formatFileSummary(file({ filetype: "pdf", width: "321", height: "444", filename: "Poster 4 pagespdf.pdf" })))
            .toBe("PDF · 321 × 444 px · Poster 4 pagespdf.pdf");
    });

    test('Leaves out missing parts', () => {
        expect(formatFileSummary(file({ filetype: ".docx", filename: "Brief.docx" }))).toBe("DOCX · Brief.docx");
    });

    test('Formats dimensions only when both width and height exist', () => {
        expect(formatDimensions(800, undefined)).toBe("");
    });
});

describe('isAltTextMissing', () => {
    test('Is true for an image without alt text', () => {
        expect(isAltTextMissing(emptyImage)).toBe(true);
    });

    test('Is false for an image with alt text', () => {
        expect(isAltTextMissing(filledImage)).toBe(false);
    });

    test('Is false for files which are not images', () => {
        expect(isAltTextMissing(file({ basetype: "document", altText: "" }))).toBe(false);
    });
});

describe('getKeywords', () => {
    test('Returns the keywords without blank ones', () => {
        expect(getKeywords(file({ keywords: ["cat", " ", "relax"] }))).toEqual(["cat", "relax"]);
    });
});

describe('getPreviewUrl', () => {
    test('Uses the CDN url for images', () => {
        expect(getPreviewUrl(emptyImage)).toBe(emptyImage.url);
    });

    test('Uses the Mediaflow preview for other files', () => {
        expect(getPreviewUrl(file({ basetype: "document", url: "https://cdn/file.pdf", mediumPreview: "https://preview/medium.jpg" }))).toBe("https://preview/medium.jpg");
    });

    test('Returns null when a file has no preview', () => {
        expect(getPreviewUrl(file({ basetype: "document", url: "https://cdn/file.pdf" }))).toBe(null);
    });

    test('Picks a fitting icon for files without preview', () => {
        expect(getAssetIconType(file({ basetype: "document", filetype: "pdf" }))).toBe("pdf");
    });
});

describe('buildMetadataSections', () => {
    test('Builds the sections in display order', () => {
        expect(buildMetadataSections(emptyImage).map(section => section.title)).toEqual(["Content", "Custom fields", "File", "Technical"]);
    });

    test('Uses the custom field titles from Mediaflow as labels', () => {
        const customFields = findSection(buildMetadataSections(filledImage), "customFields");
        expect(customFields.fields.map(field => field.label)).toEqual(["Campaign", "Channels", "Approved by"]);
    });

    test('Marks empty fields as empty', () => {
        const content = findSection(buildMetadataSections(emptyImage), "content");
        expect(content.fields.every(field => field.isEmpty)).toBe(true);
    });

    test('Marks only the ID and CDN URL as technical', () => {
        const technicalIds = buildMetadataSections(emptyImage).flatMap(section => section.fields).filter(field => field.isTechnical).map(field => field.id);
        expect(technicalIds).toEqual(["id", "url"]);
    });
});

describe('countFilledFields', () => {
    test('Counts filled fields across all sections', () => {
        // Content 4 of 6, custom fields 2 of 3, file 4 of 4, technical 2 of 2
        expect(countFilledFields(buildMetadataSections(filledImage))).toEqual({ filled: 12, total: 15 });
    });

    test('Counts an empty file correctly', () => {
        expect(countFilledFields(buildMetadataSections(emptyImage))).toEqual({ filled: 5, total: 12 });
    });
});

describe('getVisibleFields', () => {
    const fields = [row("a", false), row("b", true)];

    test('Hides empty fields by default', () => {
        expect(getVisibleFields(fields, false).map(field => field.id)).toEqual(["a"]);
    });

    test('Shows empty fields when toggled on', () => {
        expect(getVisibleFields(fields, true).map(field => field.id)).toEqual(["a", "b"]);
    });
});

describe('getMetadataStatus', () => {
    test('Shows "Up to date" for a positive check', () => {
        expect(getMetadataStatus({ type: "positive", value: "Metadata is up to date" }, false, false)).toEqual({ tone: "positive", label: "Up to date" });
    });

    test('Shows "Syncing…" while syncing, whatever the last check said', () => {
        expect(getMetadataStatus({ type: "positive", value: "Metadata is up to date" }, true, false).label).toBe("Syncing…");
    });

    test('Passes on the reason of a negative check', () => {
        expect(getMetadataStatus({ type: "negative", value: "Image got removed" }, false, false)).toEqual({ tone: "negative", label: "Image got removed" });
    });
});

describe('getVideoPlayerMaxWidth', () => {
    test('Uses the full width for a landscape video', () => {
        expect(getVideoPlayerMaxWidth(4096, 2160)).toBe(480);
    });

    test('Narrows the player for a portrait video so it is at most 480 px high', () => {
        expect(getVideoPlayerMaxWidth(2160, 4096)).toBe(253);
    });

    test('Accepts dimensions stored as strings', () => {
        expect(getVideoPlayerMaxWidth("1080", "1920")).toBe(270);
    });

    test('Falls back to the full width when the dimensions are missing or invalid', () => {
        expect([getVideoPlayerMaxWidth(undefined, 1920), getVideoPlayerMaxWidth(1080, 0), getVideoPlayerMaxWidth("abc", "1920")]).toEqual([480, 480, 480]);
    });
});
