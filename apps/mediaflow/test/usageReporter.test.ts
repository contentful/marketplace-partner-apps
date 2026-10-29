import { test, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests when usage reports are sent, in particular for entries that have no title yet
 */
import { createUsageReporter } from '../src/utils/UsageReporter';
import type { UsageContext, UsageReport } from '../src/utils/UsageReport';

const SETTLE_MS = 2000;

let title: string | null;
let titleListener: (() => void) | null;
let sent: Array<{ fileId: string | number; report: UsageReport; keepalive: boolean }>;

const context = (): UsageContext => ({
    userName: "Adam Evertsson",
    spaceId: "space",
    spaceName: "Website",
    environmentId: "master",
    contentTypeName: "Blog post",
    entryId: "entry",
    entryTitle: title,
    fieldName: "Header Image",
    fieldLocale: null,
    webappHost: "app.contentful.com",
});

const createReporter = (hasTitleField = true) => createUsageReporter({
    getContext: context,
    send: async (fileId, report, { keepalive }) => { sent.push({ fileId, report, keepalive }); },
    onEntryTitleChanged: hasTitleField ? (callback) => { titleListener = callback; return () => { titleListener = null; }; } : null,
    titleSettleMs: SETTLE_MS,
});

const typeTitle = (value: string) => {
    title = value;
    titleListener?.();
};

beforeEach(() => {
    vi.useFakeTimers();
    title = null;
    titleListener = null;
    sent = [];
});

afterEach(() => {
    vi.useRealTimers();
});

test('Sends the report right away when the entry has a title', async () => {
    title = "Summer campaign";
    await createReporter().reportUsed(1);
    expect(sent.map(s => s.report.web.pageName)).toEqual(["Summer campaign"]);
});

test('Sends the report right away when the content type has no title field', async () => {
    await createReporter(false).reportUsed(1);
    expect(sent.map(s => s.report.web.pageName)).toEqual(["Untitled entry"]);
});

test('Waits for the title and sends the report once it has settled', async () => {
    const reporter = createReporter();
    await reporter.reportUsed(1);
    typeTitle("Summer campaign");
    const beforeSettling = sent.length;
    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect([beforeSettling, sent.map(s => s.report.web.pageName)]).toEqual([0, ["Summer campaign"]]);
});

test('Keeps waiting while the editor is still typing the title', async () => {
    const reporter = createReporter();
    await reporter.reportUsed(1);
    typeTitle("Summer");
    await vi.advanceTimersByTimeAsync(SETTLE_MS - 1);
    typeTitle("Summer campaign");
    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(sent.map(s => s.report.web.pageName)).toEqual(["Summer campaign"]);
});

test('Sends the waiting report before the removal when the file is removed before a title is typed', async () => {
    const reporter = createReporter();
    await reporter.reportUsed(1);
    await reporter.reportRemoved(1);
    expect(sent.map(s => s.report.description)).toEqual(['Used in the field "Header Image" in Contentful', 'Removed from the field "Header Image" in Contentful']);
});

test('Sends the waiting report with keepalive when the page closes', async () => {
    const reporter = createReporter();
    await reporter.reportUsed(1);
    await reporter.flushPending({ keepalive: true });
    expect(sent.map(s => [s.report.web.pageName, s.keepalive])).toEqual([["Untitled entry", true]]);
});

test('Sends a waiting report only once', async () => {
    const reporter = createReporter();
    await reporter.reportUsed(1);
    typeTitle("Summer campaign");
    await reporter.flushPending();
    await vi.advanceTimersByTimeAsync(SETTLE_MS);
    expect(sent).toHaveLength(1);
});
