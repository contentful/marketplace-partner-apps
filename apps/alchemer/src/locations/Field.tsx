import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Note,
  Paragraph,
  SkeletonBodyText,
  SkeletonContainer,
  Spinner,
  Stack,
  Text,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import { callAlchemer, parseSavedSurvey, safeAlchemerUrl, SavedSurvey, SurveySummary } from '../lib/alchemer';

// Applied to both survey preview iframes. The survey page is cross-origin to
// this app, so allow-same-origin only lets Alchemer keep its own cookies and
// session (a survey will not run without them); it grants nothing on our
// origin. allow-top-navigation is deliberately absent so a framed page can
// never navigate the Contentful tab away, and popups are not allowed because
// a preview has no reason to open windows.
const PREVIEW_SANDBOX = 'allow-scripts allow-forms allow-same-origin';

// Alchemer capitalizes statuses in API responses ("Launched", verified with
// live data 2026-08-13), so match case-insensitively.
const statusVariant = (status: string): 'positive' | 'negative' | 'secondary' => {
  const s = status.toLowerCase();
  if (s === 'launched') return 'positive';
  if (s === 'closed' || s === 'deleted') return 'negative';
  return 'secondary';
};

// The picker loads the whole survey list up front and searches it in memory:
// every app-action round trip costs seconds (browser -> CMA -> function ->
// Alchemer), so per-keystroke server search felt crawling. The cap bounds the
// upfront cost for pathological accounts; the UI says so when it is hit.
const MAX_PAGES = 10;
// Must match RESULTS_PER_PAGE in functions/alchemerProxy.ts; only used to
// size the progress bar and the truncation notice, never to slice data.
const PAGE_SIZE = 50;
const MAX_SURVEYS = MAX_PAGES * PAGE_SIZE;

// Alchemer 429s are account-wide and clear within about a minute (the shared
// 240 requests/minute budget, or an identical request already in flight when
// two editors load the same page simultaneously). Retrying the failed page in
// place keeps a partially loaded picker alive instead of discarding it; the
// waits live here in the browser because the Contentful function's execution
// window is too tight to sleep in.
const RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_RETRY_DELAY_MS = 20_000;

const listStyles = {
  container: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
  }),
  // Each survey renders as wrapper > (select button + sibling Preview
  // button) + optional preview pane. The Preview button must be a SIBLING of
  // the select button, not a child: the whole-row select target is itself a
  // <button>, and nesting interactive elements is invalid HTML.
  rowWrapper: css({
    borderBottom: `1px solid ${tokens.gray200}`,
    '&:last-child': { borderBottom: 'none' },
  }),
  rowLine: css({
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingXs,
    paddingRight: tokens.spacingS,
    background: tokens.colorWhite,
    '&:hover': { backgroundColor: tokens.gray100 },
  }),
  row: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingS,
    flexGrow: 1,
    minWidth: 0,
    padding: `${tokens.spacingS} ${tokens.spacingM}`,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    // The Select chip fills in on row hover/focus so the whole row reads as
    // one clickable target rather than a static list entry.
    '&:hover [data-select-hint], &:focus-visible [data-select-hint]': {
      backgroundColor: tokens.blue600,
      borderColor: tokens.blue600,
      color: tokens.colorWhite,
    },
    '&:focus-visible': { outline: `2px solid ${tokens.blue500}`, outlineOffset: '-2px' },
  }),
  previewPane: css({
    padding: tokens.spacingS,
    borderTop: `1px dashed ${tokens.gray300}`,
    background: tokens.colorWhite,
  }),
  // Visually a small secondary button, but a span: the row itself is already
  // a <button>, and nesting interactive elements is invalid HTML.
  selectHint: css({
    flexShrink: 0,
    border: `1px solid ${tokens.gray400}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacing2Xs} ${tokens.spacingS}`,
    fontSize: tokens.fontSizeS,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.gray700,
    backgroundColor: tokens.colorWhite,
  }),
  progressTrack: css({
    width: '100%',
    height: '6px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.gray200,
    overflow: 'hidden',
  }),
  progressFill: css({
    height: '100%',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.blue500,
    transition: 'width 300ms ease',
  }),
};

// Forma 36 has no progress component (verified against f36-components 4.81.1
// package exports), so this is a minimal determinate bar from f36 tokens.
const LoadProgressBar = ({ loaded, total }: { loaded: number; total: number }) => (
  <div className={listStyles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={loaded} aria-label="Loading surveys">
    <div className={listStyles.progressFill} style={{ width: `${total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0}%` }} />
  </div>
);

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  // The raw field value is kept as unknown and validated on every render: the
  // JSON field can be written by anything with CMA access, not just this app.
  const [value, setValue] = useState<unknown>(sdk.field.getValue());
  const saved = parseSavedSurvey(value);
  // A value is present but not one this app can display (wrong shape). The
  // editor must say so rather than crash or silently show the empty state,
  // because "Select a survey" would then overwrite data the editor never saw.
  const invalidValue = value !== undefined && value !== null && !saved;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // undefined = never loaded; the list survives closing the picker so
  // reopening it is instant.
  const [allSurveys, setAllSurveys] = useState<SurveySummary[] | undefined>();
  // Alchemer's total_count from the first page; drives the progress bar.
  const [totalCount, setTotalCount] = useState<number>();
  const [truncated, setTruncated] = useState(false);
  const [search, setSearch] = useState('');
  // Survey id whose inline preview is expanded in the picker list; only one
  // preview iframe exists at a time. Uses the share url already present in
  // the list payload, so previewing costs no extra proxy calls.
  const [previewSurveyId, setPreviewSurveyId] = useState<string>();
  const [loading, setLoading] = useState(false);
  // True while the loader is waiting out an Alchemer 429 before retrying, so
  // the UI can say why the list stopped growing.
  const [rateLimitPause, setRateLimitPause] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // Set when the saved survey no longer exists in Alchemer, so the editor
  // can warn about the stale reference instead of silently keeping it.
  const [missing, setMissing] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string | undefined>();

  // Tracks the latest load so a superseded run (user hit Refresh mid-load)
  // cannot interleave its pages with the newer run's.
  const requestSeq = useRef(0);
  // Whether opening the picker has kicked off the initial load. A ref, not
  // derived from allSurveys/loading: a first page that fails leaves
  // allSurveys undefined, and an effect keyed on that would call the proxy
  // again every time loading flipped back to false, hammering Alchemer in a
  // loop. After a failure the Refresh link is the deliberate retry path.
  const initialLoadStarted = useRef(false);

  useEffect(() => {
    sdk.window.startAutoResizer();
    const detach = sdk.field.onValueChanged((v?: unknown) => setValue(v));
    return () => {
      detach();
      sdk.window.stopAutoResizer();
    };
  }, [sdk]);

  // Verify the saved survey still exists and pick up its current status.
  // Anything other than a confirmed not-found is ignored: an unreachable
  // proxy must not block editing or flash false warnings.
  useEffect(() => {
    setMissing(false);
    setLiveStatus(undefined);
    const surveyId = saved?.surveyId;
    if (!surveyId) return;
    let cancelled = false;
    callAlchemer(sdk, { action: 'getSurvey', surveyId })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok && res.notFound) setMissing(true);
        else if (res.ok && res.survey) setLiveStatus(res.survey.status);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [sdk, saved?.surveyId]);

  // Fetches every survey page sequentially, rendering progressively so the
  // first page is visible while later ones stream in.
  const loadAll = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(undefined);
    setTruncated(false);
    setRateLimitPause(false);
    try {
      // The previewed row may not survive a reload, so collapse the preview.
      setPreviewSurveyId(undefined);
      const collected: SurveySummary[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        let res = await callAlchemer(sdk, { action: 'listSurveys', page });
        if (seq !== requestSeq.current) return;
        for (let retry = 0; !res.ok && res.rateLimited && retry < RATE_LIMIT_RETRIES; retry++) {
          setRateLimitPause(true);
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_RETRY_DELAY_MS));
          if (seq !== requestSeq.current) return;
          res = await callAlchemer(sdk, { action: 'listSurveys', page });
          if (seq !== requestSeq.current) return;
        }
        setRateLimitPause(false);
        if (!res.ok) {
          // Pages already collected stay visible alongside the error note.
          setError(res.error);
          return;
        }
        collected.push(...(res.surveys ?? []));
        totalPages = res.totalPages ?? 1;
        setTotalCount(res.totalCount ?? collected.length);
        setAllSurveys([...collected]);
        if (page >= MAX_PAGES && page < totalPages) {
          setTruncated(true);
          break;
        }
        page++;
      } while (page <= totalPages);
    } catch {
      if (seq !== requestSeq.current) return;
      // A rejection here usually means the app action call itself failed:
      // the app is not installed in this environment, the function bundle
      // was never uploaded, or the action was not created against the app
      // definition.
      setError(
        'Could not call the Alchemer proxy. Make sure the app is installed in this ' +
          'environment, the app function is uploaded, and the alchemerApi app action ' +
          'exists (see README), then reload.'
      );
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        // Covers the superseded-run early returns inside the retry pause.
        setRateLimitPause(false);
      }
    }
  }, [sdk]);

  useEffect(() => {
    if (pickerOpen && !initialLoadStarted.current) {
      initialLoadStarted.current = true;
      void loadAll();
    }
  }, [pickerOpen, loadAll]);

  // Search is purely in-memory; no server round-trip per keystroke.
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return allSurveys ?? [];
    return (allSurveys ?? []).filter((s) => s.title.toLowerCase().includes(needle));
  }, [allSurveys, search]);

  const selectSurvey = async (survey: SurveySummary) => {
    const saved: SavedSurvey = { ...survey, savedAt: new Date().toISOString() };
    await sdk.field.setValue(saved);
    setValue(saved);
    setPickerOpen(false);
    setPreviewOpen(false);
    setPreviewSurveyId(undefined);
  };

  const clearSurvey = async () => {
    await sdk.field.removeValue();
    setValue(undefined);
    setPreviewOpen(false);
  };

  if (sdk.field.type !== 'Object') {
    return (
      <Note variant="negative">
        The Alchemer app must be assigned to a JSON object field, but this field has type &quot;
        {sdk.field.type}&quot;.
      </Note>
    );
  }

  if (!saved && !pickerOpen) {
    return (
      <Stack flexDirection="column" alignItems="flex-start" spacing="spacingS">
        {invalidValue ? (
          <Note variant="warning">
            This field holds a value the Alchemer app does not recognize, so it cannot be shown here. Remove it, or select a survey to replace it.
          </Note>
        ) : (
          <Paragraph>No Alchemer survey selected.</Paragraph>
        )}
        <Flex gap="spacingS">
          <Button variant="primary" onClick={() => setPickerOpen(true)}>
            Select a survey
          </Button>
          {invalidValue && (
            <Button variant="negative" onClick={() => void clearSurvey()}>
              Remove
            </Button>
          )}
        </Flex>
      </Stack>
    );
  }

  if (pickerOpen) {
    const initialLoad = loading && (allSurveys === undefined || allSurveys.length === 0);
    const loadedCount = allSurveys?.length ?? 0;
    // What the bar counts up to: the account total, capped by the page limit.
    const expectedTotal = totalCount === undefined ? undefined : Math.min(totalCount, MAX_SURVEYS);
    return (
      <Stack flexDirection="column" alignItems="stretch" spacing="spacingS">
        <TextInput value={search} placeholder="Filter surveys by title" isDisabled={initialLoad} onChange={(e) => setSearch(e.target.value)} />
        {error && <Note variant="negative">{error}</Note>}
        {initialLoad ? (
          <Box>
            <Flex alignItems="center" gap="spacingS" marginBottom="spacingS">
              <Spinner size="small" />
              <Text fontColor="gray600">
                {rateLimitPause
                  ? 'Alchemer rate limit reached; waiting a moment to retry'
                  : `Fetching surveys from Alchemer${expectedTotal !== undefined ? ` (${loadedCount} of ${expectedTotal})` : '...'}`}
              </Text>
            </Flex>
            {expectedTotal !== undefined && (
              <Box marginBottom="spacingS">
                <LoadProgressBar loaded={loadedCount} total={expectedTotal} />
              </Box>
            )}
            <SkeletonContainer svgHeight={120}>
              <SkeletonBodyText numberOfLines={4} />
            </SkeletonContainer>
          </Box>
        ) : (
          <Stack flexDirection="column" alignItems="stretch" spacing="spacingXs">
            <Flex alignItems="center" gap="spacingS">
              <Text fontColor="gray600" fontSize="fontSizeS">
                {search.trim() ? `${filtered.length} of ${loadedCount} surveys match` : `${loadedCount} surveys — select one to link it to this entry`}
                {truncated ? ` (showing the first ${MAX_SURVEYS})` : ''}
              </Text>
              {!loading && (
                <TextLink as="button" onClick={() => void loadAll()}>
                  Refresh
                </TextLink>
              )}
            </Flex>
            {loading && expectedTotal !== undefined && (
              <Flex alignItems="center" gap="spacingS">
                <Box className={css({ flexGrow: 1 })}>
                  <LoadProgressBar loaded={loadedCount} total={expectedTotal} />
                </Box>
                <Text fontColor="gray600" fontSize="fontSizeS">
                  {rateLimitPause ? 'Rate limit reached; retrying shortly' : `Loading ${loadedCount} of ${expectedTotal}`}
                </Text>
              </Flex>
            )}
            {filtered.length === 0 && !error && (
              <Paragraph>{search.trim() ? `No surveys match "${search.trim()}".` : 'No surveys found in the connected Alchemer account.'}</Paragraph>
            )}
            {filtered.length > 0 && (
              <div className={listStyles.container}>
                {filtered.map((s) => {
                  // Alchemer's own payload is far less likely to be hostile
                  // than a hand-edited field value, but the iframe check is
                  // the same cheap rule either way, and a survey without a
                  // valid https share link has nothing to preview anyway.
                  const previewUrl = safeAlchemerUrl(s.url);
                  return (
                    <div key={s.surveyId} className={listStyles.rowWrapper}>
                      <div className={listStyles.rowLine}>
                        <button type="button" className={listStyles.row} onClick={() => void selectSurvey(s)}>
                          <Stack flexDirection="column" alignItems="flex-start" spacing="spacing2Xs">
                            <Text fontWeight="fontWeightMedium">{s.title}</Text>
                            <Text fontColor="gray600" fontSize="fontSizeS">
                              Survey {s.surveyId}
                              {s.modifiedOn ? ` · updated ${s.modifiedOn.slice(0, 10)}` : ''}
                            </Text>
                          </Stack>
                          <Flex alignItems="center" gap="spacingS">
                            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                            <span className={listStyles.selectHint} data-select-hint>
                              Select
                            </span>
                          </Flex>
                        </button>
                        {previewUrl && (
                          <Button
                            variant="transparent"
                            size="small"
                            onClick={() => setPreviewSurveyId((current) => (current === s.surveyId ? undefined : s.surveyId))}>
                            {previewSurveyId === s.surveyId ? 'Hide' : 'Preview'}
                          </Button>
                        )}
                      </div>
                      {previewUrl && previewSurveyId === s.surveyId && (
                        <div className={listStyles.previewPane}>
                          <iframe
                            title={`Preview of ${s.title}`}
                            src={previewUrl}
                            sandbox={PREVIEW_SANDBOX}
                            referrerPolicy="no-referrer"
                            style={{ width: '100%', height: '420px', border: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Stack>
        )}
        <Box>
          <Button variant="transparent" onClick={() => setPickerOpen(false)}>
            Cancel
          </Button>
        </Box>
      </Stack>
    );
  }

  // A survey is selected and the picker is closed: show the summary card.
  // The two branches above return for every !saved case, but TypeScript
  // cannot see that across the combined condition, hence the guard.
  if (!saved) return null;
  // Links and the preview only render for https URLs on an Alchemer domain
  // (see safeAlchemerUrl). Anything else is reported, never rendered: a
  // javascript: href would run with this editor's SDK access.
  const shareUrl = safeAlchemerUrl(saved.url);
  const editUrl = safeAlchemerUrl(saved.editUrl);
  const status = liveStatus ?? saved.status;
  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingS">
      {missing && <Note variant="warning">This survey no longer exists in Alchemer. Clear the field or select a different survey.</Note>}
      {(!shareUrl || !editUrl) && (
        <Note variant="warning">
          The saved survey links are not Alchemer URLs, so the preview and links are disabled. Use Change to select the survey again, which rewrites the stored
          value.
        </Note>
      )}
      <Card>
        <Flex justifyContent="space-between" alignItems="center" gap="spacingS">
          <Stack flexDirection="column" alignItems="flex-start" spacing="spacing2Xs">
            <Text fontWeight="fontWeightMedium">{saved.title}</Text>
            <Text fontColor="gray600" fontSize="fontSizeS">
              Survey {saved.surveyId}
            </Text>
          </Stack>
          <Badge variant={statusVariant(status)}>{status}</Badge>
        </Flex>
      </Card>
      <Flex gap="spacingS" flexWrap="wrap" alignItems="center">
        {shareUrl && (
          <Button variant="secondary" size="small" onClick={() => setPreviewOpen((p) => !p)}>
            {previewOpen ? 'Hide preview' : 'Preview'}
          </Button>
        )}
        <Button variant="secondary" size="small" onClick={() => setPickerOpen(true)}>
          Change
        </Button>
        <Button variant="negative" size="small" onClick={() => void clearSurvey()}>
          Remove
        </Button>
        {editUrl && (
          <TextLink href={editUrl} target="_blank" rel="noopener noreferrer">
            Edit in Alchemer
          </TextLink>
        )}
        {shareUrl && (
          <TextLink href={shareUrl} target="_blank" rel="noopener noreferrer">
            Open share link
          </TextLink>
        )}
      </Flex>
      {previewOpen && shareUrl && (
        <iframe
          title="Alchemer survey preview"
          src={shareUrl}
          sandbox={PREVIEW_SANDBOX}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '520px', border: 'none' }}
        />
      )}
    </Stack>
  );
};

export default Field;
