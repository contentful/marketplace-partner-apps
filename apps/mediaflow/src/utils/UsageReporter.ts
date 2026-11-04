import { buildUsageReport } from "./UsageReport";
import type { UsageContext, UsageReport } from "./UsageReport";

type MediaflowId = string | number;

/**
 * What the reporter needs from the field location
 */
export interface UsageReporterOptions {
  /** Where the file is used, including the entry's current title. Must not wait, so it also works while the page closes */
  getContext: () => UsageContext;
  /** Sends one report to Mediaflow. keepalive is set while the page closes */
  send: (fileId: MediaflowId, report: UsageReport, options: { keepalive: boolean }) => Promise<void>;
  /** Subscribes to changes of the entry's title field, or null when the content type has no title field */
  onEntryTitleChanged: ((callback: () => void) => () => void) | null;
  /** How long the title has to stay unchanged before the waiting report is sent */
  titleSettleMs?: number;
  now?: () => Date;
}

/**
 * Sends usage reports to Mediaflow. A file added to an entry without a title waits for the editor to type one,
 * since a report cannot be corrected later without a permission most editors lack.
 */
export interface UsageReporter {
  reportUsed: (fileId: MediaflowId) => Promise<void>;
  /** Sends the waiting report first, so a file that was replaced or removed is still reported as used */
  reportRemoved: (fileId: MediaflowId) => Promise<void>;
  /** Sends the waiting report now, with or without a title */
  flushPending: (options?: { keepalive: boolean }) => Promise<void>;
  /** Drops the waiting report and stops listening */
  dispose: () => void;
}

const DEFAULT_TITLE_SETTLE_MS = 2000;

/**
 * @param options - What the reporter needs from the field location
 * @returns The reporter for one field
 */
export function createUsageReporter(options: UsageReporterOptions): UsageReporter {
  const titleSettleMs = options.titleSettleMs ?? DEFAULT_TITLE_SETTLE_MS;
  const now = options.now ?? (() => new Date());
  let pendingFileId: MediaflowId | null = null;
  let stopListening: (() => void) | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;

  const clearPending = (): void => {
    pendingFileId = null;
    clearTimeout(settleTimer);
    stopListening?.();
    stopListening = null;
  };

  const send = (fileId: MediaflowId, isRemoval: boolean, keepalive = false): Promise<void> => {
    const report = buildUsageReport(options.getContext(), isRemoval, now());
    return options.send(fileId, report, { keepalive });
  };

  const flushPending = async ({ keepalive } = { keepalive: false }): Promise<void> => {
    if(pendingFileId === null) {
      return;
    }
    const fileId = pendingFileId;
    clearPending();
    await send(fileId, false, keepalive);
  };

  const waitForTitle = (fileId: MediaflowId, onEntryTitleChanged: (callback: () => void) => () => void): void => {
    clearPending();
    pendingFileId = fileId;
    stopListening = onEntryTitleChanged(() => {
      clearTimeout(settleTimer);
      if(options.getContext().entryTitle) {
        settleTimer = setTimeout(() => { flushPending(); }, titleSettleMs);
      }
    });
  };

  return {
    reportUsed: async (fileId) => {
      await flushPending();
      const hasTitle = options.getContext().entryTitle !== null;
      if(hasTitle || !options.onEntryTitleChanged) {
        await send(fileId, false);
        return;
      }
      waitForTitle(fileId, options.onEntryTitleChanged);
    },
    reportRemoved: async (fileId) => {
      await flushPending();
      await send(fileId, true);
    },
    flushPending,
    dispose: clearPending,
  };
}
