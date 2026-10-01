import type { FunctionEventHandler, FunctionTypeEnum } from '@contentful/node-apps-toolkit';
import { createClient } from 'contentful-management';
import { autoTagEntry, readOptionalEntryId, readParameters, readRunOptions, type AutoTagCma, type RoleLookupCma } from '../lib/autoTag';
import { describeError } from '../lib/errors';

/**
 * Logs a line the way the function logs always have, and keeps a copy. The copy is returned with the
 * result, so the config screen's Troubleshooting tab shows exactly what the logs say. A Marketplace
 * customer cannot read this app's function logs, because those belong to the definition's owner.
 */
function makeLog() {
  const lines: string[] = [];
  const log = (...args: unknown[]) => {
    console.log(...args);
    lines.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  };
  return { log, lines };
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (event, context) => {
  const { log, lines } = makeLog();
  // Read first, so a failure below knows whether this was the Troubleshooting tab's dry run. An
  // unreadable body counts as a real run.
  // Read straight off the body rather than through readRunOptions, because a malformed role ID makes
  // that throw — and the dry run is exactly when the tab needs the message back.
  const rawDryRun = (event.body as { dryRun?: unknown } | null)?.dryRun;
  const dryRun = rawDryRun === true || rawDryRun === 'true';
  try {
    const options = readRunOptions(event.body);
    const entryId = readOptionalEntryId(event.body, options);

    const { spaceId, environmentId } = context;
    const params = readParameters(context.appInstallationParameters);

    // PAT-based client for membership lookup (app identity cannot read space members). Few retries,
    // so a failing request surfaces in seconds with its real message rather than after a long backoff.
    const patCma = createClient({ accessToken: params.cmaToken, retryLimit: 2 }, { type: 'plain' });

    // The engine declares only the members it uses; the full clients satisfy them structurally.
    const outcome = await autoTagEntry({
      cma: context.cma as unknown as AutoTagCma,
      patCma: patCma as unknown as RoleLookupCma,
      spaceId,
      environmentId,
      entryId,
      params,
      options,
      log,
    });
    return { ...outcome, log: lines };
  } catch (err) {
    // Formatted once, so the log line and the message the Troubleshooting tab shows are the same text.
    const message = describeError(err);
    console.error(message);
    lines.push(message);
    // A thrown error reaches the caller only as "failed (code-error)", with the message dropped.
    // A dry run therefore RETURNS the failure so the tab can show it. A real run still throws, so the
    // Automation's run history marks it failed.
    if (dryRun) return { failed: true, error: message, log: lines };
    throw new Error(message, { cause: err });
  }
};
