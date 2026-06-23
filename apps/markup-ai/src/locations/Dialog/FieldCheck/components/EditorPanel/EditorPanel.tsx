/**
 * Editor panel with TipTap editor and Cortex issue highlighting.
 */

import React, { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import xml from "highlight.js/lib/languages/xml";
import markdown from "highlight.js/lib/languages/markdown";
import "highlight.js/styles/github.css";
import { Spinner, Text } from "@contentful/f36-components";
import type { CortexIssueWithId } from "../../../../../agents/types";
import { IssueHighlights } from "../IssueHighlights/IssueHighlights";
import type { IssueSourceFormat } from "../IssueHighlights/types";
import { NodeIdMark } from "./NodeIdMark";
import { detectSyntaxKind, formatMarkup, type SyntaxKind } from "../../utils";
import type { JSONContent } from "@tiptap/core";
import {
  PanelContainer,
  EditorContainer,
  LoadingOverlay,
  LoadingContent,
} from "./EditorPanel.styles";

export interface EditorPanelProps {
  initialContent: string;
  /** All Cortex issues (unfiltered). */
  issues?: CortexIssueWithId[];
  /** Indices of issues that should be visible (after filter/dismiss). */
  visibleIndices?: number[];
  /** Source format submitted to Cortex (used to translate offsets into editor positions). */
  sourceFormat: IssueSourceFormat;
  /** Source text submitted to Cortex; required when sourceFormat !== "plain". */
  sourceText?: string;
  /** Increments when a new scan is run - triggers decoration rebuild. */
  scanId?: number;
  isBusy?: boolean;
  editorContentRef?: React.RefObject<(() => string) | null>;
  /** Whether the content is RichText (renders as HTML instead of code block). */
  isRichText?: boolean;
  selectedIssueIndex?: number | null;
  onIssueSelect?: (issue: CortexIssueWithId | null, index: number) => void;
  applyIssueRef?: React.RefObject<((index: number, replacement?: string) => void) | null>;
  applyIssuesRef?: React.RefObject<((indices: number[], replacement: string) => void) | null>;
  onIssuesRemoved?: (indices: number[]) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  initialContent,
  issues = [],
  visibleIndices = [],
  sourceFormat,
  sourceText,
  scanId = 0,
  isBusy = false,
  editorContentRef,
  isRichText = false,
  selectedIssueIndex,
  onIssueSelect,
  applyIssueRef,
  applyIssuesRef,
  onIssuesRemoved,
}) => {
  const lastScanIdRef = useRef<number>(0);

  const lowlight = createLowlight();
  lowlight.register("xml", xml);
  lowlight.register("markdown", markdown);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      NodeIdMark,
      IssueHighlights.configure({
        issues: [],
        sourceFormat,
        sourceText,
        onIssueClick: ({ issue, index }) => {
          onIssueSelect?.(issue, index);
        },
      }),
    ],
    content: "",
    enableInputRules: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        spellcheck: "false",
        autocorrect: "off",
        autocapitalize: "off",
      },
    },
  });

  useEffect(() => {
    if (!editor || !initialContent) return;

    if (isRichText) {
      setEditorTextContent(editor, initialContent, null, true);
    } else {
      const syntax = detectSyntaxKind(initialContent);
      const text =
        syntax === "html" || syntax === "xml"
          ? formatMarkup(initialContent, syntax)
          : initialContent;
      setEditorTextContent(editor, text, syntax);
    }
  }, [editor, initialContent, isRichText]);

  useEffect(() => {
    if (!editor || scanId === 0) return;

    if (scanId !== lastScanIdRef.current) {
      lastScanIdRef.current = scanId;

      if (issues.length > 0) {
        editor.commands.setIssueHighlights(issues, sourceFormat, sourceText);
      } else {
        editor.commands.clearIssueHighlights();
      }
    }
  }, [editor, scanId, issues, sourceFormat, sourceText]);

  useEffect(() => {
    if (!editor || scanId === 0) return;
    if (lastScanIdRef.current > 0) {
      editor.commands.setVisibleIssues(visibleIndices);
    }
  }, [editor, scanId, visibleIndices]);

  useEffect(() => {
    if (
      !editor ||
      selectedIssueIndex === null ||
      selectedIssueIndex === undefined ||
      selectedIssueIndex < 0
    ) {
      return;
    }
    editor.commands.goToIssueByIndex(selectedIssueIndex);
  }, [editor, selectedIssueIndex]);

  const contentAsText = useCallback(() => {
    if (!editor) return "";
    // TipTap's getHTML() emits bare void tags (<br>, <hr>); the Language Server
    // parses the submitted HTML as XHTML and rejects them, so self-close them.
    if (isRichText) return editor.getHTML().replace(/<(br|hr)\s*\/?>/gi, "<$1 />");
    const doc = editor.state.doc;
    return doc.textBetween(0, doc.content.size, "\n\n", "\n");
  }, [editor, isRichText]);

  useEffect(() => {
    if (editorContentRef) editorContentRef.current = contentAsText;
  }, [editorContentRef, contentAsText]);

  const applyIssue = useCallback(
    (index: number, replacement?: string) => {
      if (!editor) return;
      if (index < 0 || index >= issues.length) return;
      const targetIssue = issues[index];
      const targetFrom = targetIssue.position.start;
      const targetTo = targetIssue.position.end;

      const overlappingIndices = issues
        .map((s, i) => ({ issue: s, index: i }))
        .filter(({ issue }) => {
          const from = issue.position.start;
          const to = issue.position.end;
          return !(to <= targetFrom || from >= targetTo);
        })
        .map(({ index: i }) => i);

      editor.commands.applyIssueByIndex(index, replacement);

      if (onIssuesRemoved && overlappingIndices.length > 0) {
        onIssuesRemoved(overlappingIndices);
      }
    },
    [editor, issues, onIssuesRemoved],
  );

  const applyIssuesBatch = useCallback(
    (indices: number[], replacement: string) => {
      if (!editor || indices.length === 0) return;
      const targetRanges = indices
        .filter((i) => i >= 0 && i < issues.length)
        .map((i) => ({
          from: issues[i].position.start,
          to: issues[i].position.end,
        }));

      const overlappingIndices = issues
        .map((s, i) => ({ issue: s, index: i }))
        .filter(({ issue }) => {
          const from = issue.position.start;
          const to = issue.position.end;
          return targetRanges.some((r) => !(to <= r.from || from >= r.to));
        })
        .map(({ index: i }) => i);

      editor.commands.applyIssuesByIndices(indices, replacement);

      if (onIssuesRemoved && overlappingIndices.length > 0) {
        onIssuesRemoved(overlappingIndices);
      }
    },
    [editor, issues, onIssuesRemoved],
  );

  useEffect(() => {
    if (applyIssueRef) applyIssueRef.current = applyIssue;
  }, [applyIssueRef, applyIssue]);

  useEffect(() => {
    if (applyIssuesRef) applyIssuesRef.current = applyIssuesBatch;
  }, [applyIssuesRef, applyIssuesBatch]);

  const setEditorTextContent = (
    ed: typeof editor,
    text: string,
    syntax: SyntaxKind | null,
    renderAsHtml = false,
  ) => {
    if (!ed) return;

    if (renderAsHtml) {
      ed.commands.setContent(text);
      return;
    }

    if (syntax === "html" || syntax === "markdown" || syntax === "xml") {
      const doc: JSONContent = {
        type: "doc",
        content: [
          {
            type: "codeBlock",
            attrs: { language: syntax === "xml" ? "xml" : syntax },
            content: [{ type: "text", text }],
          },
        ],
      };
      ed.commands.setContent(doc);
      return;
    }

    const lines = text.split("\n");
    const nodes: JSONContent[] = [];
    lines.forEach((line, idx) => {
      if (idx > 0) nodes.push({ type: "hardBreak" });
      if (line.length > 0) nodes.push({ type: "text", text: line });
    });

    const paragraph: JSONContent = { type: "paragraph" };
    if (nodes.length) paragraph.content = nodes;

    const doc: JSONContent = {
      type: "doc",
      content: [paragraph],
    };
    ed.commands.setContent(doc);
  };

  return (
    <PanelContainer>
      <EditorContainer>
        {editor && <EditorContent editor={editor} />}
        {isBusy && (
          <LoadingOverlay>
            <LoadingContent>
              <Spinner size="medium" />
              <Text>Analyzing content…</Text>
            </LoadingContent>
          </LoadingOverlay>
        )}
      </EditorContainer>
    </PanelContainer>
  );
};
