import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EditorState, StateField, RangeSetBuilder } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { MergeView } from '@codemirror/merge';
import { markdown } from '@codemirror/lang-markdown';
import { html as htmlLang } from '@codemirror/lang-html';
import {
  ContentDiffWrapper,
  ContentBlock,
  ContentHeader,
  ContentTitle,
  ScoreBadge,
  ScoreText,
  ScoreNumber,
  MergeContainer,
  MergeHost,
  ControlsRow,
  HeaderSide,
  PreviewContainer,
  PaneHeadersRow,
  PaneHeader,
  PaneLabel,
} from './ContentDiff.styles';
import { getScoreColor, formatScoreForDisplay } from '../../../utils/scoreColors';
import { Switch } from '@contentful/f36-components';
import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import { diffWordsWithSpace } from 'diff';

interface ContentDiffProps {
  original: string;
  improved: string;
  originalScore: number;
  improvedScore: number;
  previewFormat?: 'markdown' | 'html';
}

export const ContentDiff: React.FC<ContentDiffProps> = ({
  original,
  improved,
  originalScore,
  improvedScore,
  previewFormat = 'markdown',
}) => {
  const sdk = useSDK<DialogAppSDK>();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mergeRef = useRef<MergeView | null>(null);
  const scrollCleanupRef = useRef<Array<() => void>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'markdown' | 'html'>(previewFormat);
  // We preview the improved content directly (from API), not the merged editor content

  const md = useMemo(
    () =>
      new MarkdownIt({
        breaks: true, // treat single newlines as <br>
        linkify: true,
        html: false,
      }),
    [],
  );
  const hasAnyContent = (original && original.length > 0) || (improved && improved.length > 0);
  const computedHeight = useMemo(() => {
    const lineCount = Math.max(
      original ? original.split(/\r?\n/).length : 0,
      improved ? improved.split(/\r?\n/).length : 0,
    );
    // Heuristic for long single-paragraph content: approximate wrapped lines at ~80 chars
    const approxWrappedOriginal = original ? Math.ceil(original.length / 80) : 0;
    const approxWrappedImproved = improved ? Math.ceil(improved.length / 80) : 0;
    const effectiveLines = Math.max(lineCount, approxWrappedOriginal, approxWrappedImproved);

    const perLine = 22; // px per line in CodeMirror lineWrapping
    const basePadding = 80; // gutters, headers, etc.
    const px = Math.round(effectiveLines * perLine + basePadding);
    // Clamp between 140 and 400 so short content shrinks and long content grows up to max
    return Math.min(400, Math.max(140, px));
  }, [original, improved]);

  const mergedTheme = useMemo(
    () =>
      EditorView.theme({
        '&': { height: '100%' },
        '.cm-scroller': { height: '100%', overflow: 'auto' },
        '.cm-gutters': { height: '100%' },
        '.cm-content, .cm-gutters': {
          fontFamily:
            "'Geist Mono', Geist, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
          fontSize: '0.9rem',
        },
        '.cm-word-change': {
          textDecoration: 'underline',
          textDecorationStyle: 'solid',
          textUnderlineOffset: '3px',
          textDecorationThickness: '2px',
        },
        '.cm-word-change-original': {
          textDecorationColor: '#ef4540',
        },
        '.cm-word-change-improved': {
          textDecorationColor: '#78FD86',
        },
      }),
    [],
  );

  // Build word-level underline decorations based on diffWords output
  const wordDiff = useMemo(() => diffWordsWithSpace(original || '', improved || ''), [original, improved]);

  const wordChangeHighlighter = useMemo(() => {
    const buildField = (side: 'original' | 'improved') =>
      StateField.define<import('@codemirror/view').DecorationSet>({
        create() {
          const builder = new RangeSetBuilder<ReturnType<typeof Decoration.mark>>();
          let posOriginal = 0;
          let posImproved = 0;
          for (const part of wordDiff) {
            const text = part.value ?? '';
            // Skip pure-whitespace tokens to avoid offset artifacts
            if (!text || /^\s+$/.test(text)) {
              if (part.added) posImproved += text.length;
              else if (part.removed) posOriginal += text.length;
              else {
                posOriginal += text.length;
                posImproved += text.length;
              }
              continue;
            }
            if (part.added) {
              // present only in improved
              if (side === 'improved') {
                const from = posImproved;
                const to = from + text.length;
                if (from !== to) {
                  const leadingWs = (/^\s+/.exec(text) || [''])[0].length;
                  const trailingWs = (/\s+$/.exec(text) || [''])[0].length;
                  const localStart = leadingWs;
                  const localEnd = text.length - trailingWs;
                  if (localEnd > localStart) {
                    builder.add(
                      from + localStart,
                      Math.min(to, from + localEnd),
                      Decoration.mark({ class: 'cm-word-change cm-word-change-improved' }),
                    );
                  }
                }
              }
              posImproved += text.length;
            } else if (part.removed) {
              // present only in original
              if (side === 'original') {
                const from = posOriginal;
                const to = from + text.length;
                if (from !== to) {
                  const leadingWs = (/^\s+/.exec(text) || [''])[0].length;
                  const trailingWs = (/\s+$/.exec(text) || [''])[0].length;
                  const localStart = leadingWs;
                  const localEnd = text.length - trailingWs;
                  if (localEnd > localStart) {
                    builder.add(
                      from + localStart,
                      Math.min(to, from + localEnd),
                      Decoration.mark({ class: 'cm-word-change cm-word-change-original' }),
                    );
                  }
                }
              }
              posOriginal += text.length;
            } else {
              // unchanged text advances both
              posOriginal += text.length;
              posImproved += text.length;
            }
          }
          return builder.finish();
        },
        update(deco) {
          // Editors are read-only; decorations remain static
          return deco;
        },
        provide: (f) => EditorView.decorations.from(f),
      });
    return { originalField: buildField('original'), improvedField: buildField('improved') };
  }, [wordDiff]);
  const buildExtensionsA = useMemo(
    () => [
      markdown(),
      htmlLang(),
      EditorView.lineWrapping,
      mergedTheme,
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      wordChangeHighlighter.originalField,
    ],
    [mergedTheme, wordChangeHighlighter.originalField],
  );
  const buildExtensionsB = useMemo(
    () => [
      markdown(),
      htmlLang(),
      EditorView.lineWrapping,
      mergedTheme,
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      wordChangeHighlighter.improvedField,
    ],
    [mergedTheme, wordChangeHighlighter.improvedField],
  );

  const destroyMerge = () => {
    if (mergeRef.current) {
      // MergeView has a destroy method at runtime, but types may not include it
      (mergeRef.current as unknown as { destroy?: () => void }).destroy?.();
      mergeRef.current = null;
    }
    // Remove any scroll listeners
    if (scrollCleanupRef.current.length) {
      scrollCleanupRef.current.forEach((fn) => {
        try {
          fn();
        } catch {
          // no-op
        }
      });
      scrollCleanupRef.current = [];
    }
    if (hostRef.current) {
      hostRef.current.innerHTML = '';
    }
  };

  const initMerge = (initialMergedDoc: string) => {
    if (!hostRef.current) return;
    destroyMerge();
    // Build editor options directly (safer than passing prebuilt states)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      a: { doc: initialMergedDoc, extensions: buildExtensionsA },
      b: { doc: improved, extensions: buildExtensionsB },
      parent: hostRef.current,
      orientation: 'a-b',
      // Disable built-in character-level change marks and revert controls
      highlightChanges: false,
      revertControls: false,
      gutter: true,
    };
    // Construct merge view
    mergeRef.current = new (MergeView as unknown as new (o: unknown) => MergeView)(options);
    // Wire synchronized scrolling between a and b
    try {
      const aView = (mergeRef.current as unknown as { a?: EditorView; b?: EditorView }).a;
      const bView = (mergeRef.current as unknown as { a?: EditorView; b?: EditorView }).b;
      if (aView && bView) {
        let isSyncing = false;
        const sync = (source: EditorView, targets: EditorView[]) => {
          const handler = () => {
            if (isSyncing) return;
            isSyncing = true;
            for (const t of targets) {
              t.scrollDOM.scrollTop = source.scrollDOM.scrollTop;
              t.scrollDOM.scrollLeft = source.scrollDOM.scrollLeft;
            }
            isSyncing = false;
          };
          source.scrollDOM.addEventListener('scroll', handler);
          return () => source.scrollDOM.removeEventListener('scroll', handler);
        };
        const offA = sync(aView, [bView]);
        const offB = sync(bView, [aView]);
        scrollCleanupRef.current.push(offA, offB);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (showPreview) return;
    if (hasAnyContent) {
      initMerge(original);
    } else {
      destroyMerge();
    }
    return () => destroyMerge();
  }, [original, improved, hasAnyContent, showPreview]);

  // Toggle behavior: when entering preview, destroy the merge editor.
  // When leaving preview, reinitialize merge view into the host.
  useEffect(() => {
    if (showPreview) {
      destroyMerge();
    } else if (hasAnyContent) {
      initMerge(original);
    }
  }, [showPreview, hasAnyContent, original]);

  // Ask Contentful host to resize when toggling modes or when content inputs change
  useEffect(() => {
    const resize = () => {
      try {
        sdk.window.updateHeight();
      } catch {
        // ignore errors from host resize
      }
    };
    resize();
    const raf = requestAnimationFrame(resize);
    const t = setTimeout(resize, 150);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [sdk.window, showPreview, previewMode, improved, original]);

  // Keep preview mode in sync if prop changes
  useEffect(() => {
    setPreviewMode(previewFormat);
  }, [previewFormat]);

  const previewHtml = useMemo(() => {
    const current = improved ?? '';
    if (previewMode === 'markdown') {
      const rendered = md.render(current);
      return DOMPurify.sanitize(rendered);
    }
    return DOMPurify.sanitize(current);
  }, [improved, md, previewMode]);

  return (
    <ContentDiffWrapper>
      <ContentBlock>
        <ContentHeader>
          <HeaderSide />
          <HeaderSide>
            <Switch
              isChecked={showPreview}
              onChange={() => setShowPreview((v) => !v)}
              aria-label="Toggle preview of improved content"
            >
              Preview
            </Switch>
          </HeaderSide>
        </ContentHeader>

        <MergeContainer>
          {!showPreview && (
            <PaneHeadersRow>
              <PaneHeader>
                <PaneLabel>Original Content</PaneLabel>
                <ScoreBadge background={getScoreColor(originalScore).background}>
                  <ScoreText>Score</ScoreText>
                  <ScoreNumber>{formatScoreForDisplay(originalScore)}</ScoreNumber>
                </ScoreBadge>
              </PaneHeader>
              <PaneHeader>
                <PaneLabel>Improved Content</PaneLabel>
                <ScoreBadge background={getScoreColor(improvedScore).background}>
                  <ScoreText>Score</ScoreText>
                  <ScoreNumber>{formatScoreForDisplay(improvedScore)}</ScoreNumber>
                </ScoreBadge>
              </PaneHeader>
            </PaneHeadersRow>
          )}

          {!showPreview &&
            (!hasAnyContent ? (
              <PreviewContainer>
                <div style={{ color: '#5A657C' }}>No content to compare.</div>
              </PreviewContainer>
            ) : (
              <MergeHost ref={hostRef} $hidden={false} $heightPx={computedHeight} />
            ))}

          {showPreview && (
            <>
              <ControlsRow>
                <HeaderSide>
                  <ContentTitle>Rendered Preview</ContentTitle>
                </HeaderSide>
              </ControlsRow>
              <PreviewContainer>
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </PreviewContainer>
            </>
          )}
        </MergeContainer>
      </ContentBlock>
    </ContentDiffWrapper>
  );
};
