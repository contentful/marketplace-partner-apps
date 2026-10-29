import { test, expect, describe } from 'vitest';

/**
 * Tests the usage report sent to Mediaflow
 */
import { buildUsageReport, toEntryTitle } from '../src/utils/UsageReport';
import type { UsageContext } from '../src/utils/UsageReport';

const context: UsageContext = {
    userName: "Adam Evertsson",
    spaceId: "abgrvnjybz96",
    spaceName: "Website",
    environmentId: "master",
    contentTypeName: "Blog post",
    entryId: "7eTzCwucx93dGCyC9zcUXc",
    entryTitle: "Summer campaign",
    fieldName: "Header Image",
    fieldLocale: null,
    webappHost: "app.contentful.com",
};
const date = new Date(2026, 9, 26, 14, 5, 9);

describe('toEntryTitle', () => {
    test('Trims the title', () => {
        expect(toEntryTitle("  Summer campaign ")).toBe("Summer campaign");
    });

    test('Treats a blank or missing title as no title', () => {
        expect([toEntryTitle(""), toEntryTitle("   "), toEntryTitle(undefined), toEntryTitle(42)]).toEqual([null, null, null, null]);
    });
});

describe('buildUsageReport', () => {
    test('Names the space, content type and entry in the project', () => {
        expect(buildUsageReport(context, false, date).project).toBe("Contentful: Website › Blog post › Summer campaign");
    });

    test('Names the environment when it is not the default one', () => {
        expect(buildUsageReport({ ...context, environmentId: "staging" }, false, date).project).toBe("Contentful: Website (staging) › Blog post › Summer campaign");
    });

    test('Uses "Untitled entry" when the entry has no title', () => {
        const report = buildUsageReport({ ...context, entryTitle: null }, false, date);
        expect([report.project, report.web.pageName]).toEqual(["Contentful: Website › Blog post › Untitled entry", "Untitled entry"]);
    });

    test('Uses the entry title as the page name', () => {
        expect(buildUsageReport(context, false, date).web.pageName).toBe("Summer campaign");
    });

    test('Links to the entry in its environment and region', () => {
        expect(buildUsageReport({ ...context, environmentId: "staging", webappHost: "app.eu.contentful.com" }, false, date).web.page)
            .toBe("https://app.eu.contentful.com/spaces/abgrvnjybz96/environments/staging/entries/7eTzCwucx93dGCyC9zcUXc");
    });

    test('Describes where the file was used', () => {
        expect(buildUsageReport(context, false, date).description).toBe('Used in the field "Header Image" in Contentful');
    });

    test('Describes where the file was removed from, including the locale of a localized field', () => {
        expect(buildUsageReport({ ...context, fieldLocale: "sv-SE" }, true, date).description).toBe('Removed from the field "Header Image" (sv-SE) in Contentful');
    });

    test('Sends the local date and time in the format Mediaflow expects', () => {
        expect(buildUsageReport(context, false, date).date).toBe("2026-10-26 14:05:09");
    });
});
