/**
 * Editor panel with TipTap editor and issue highlighting
 * Simplified version - filtering and issue cards are in the sidebar
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
import type { Suggestion } from "../../../../../api-client/types.gen";
import { IssueHighlights } from "../IssueHighlights/IssueHighlights";
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
  /** All suggestions from the API (unfiltered) */
  suggestions?: Suggestion[];
  /** Indices of suggestions that should be visible (after filter/dismiss) */
  visibleIndices?: number[];
  /** Increments when a new check is run - triggers decoration rebuild */
  checkId?: number;
  isBusy?: boolean;
  editorContentRef?: React.MutableRefObject<(() => string) | null>;
  /** Whether the content is RichText (renders as HTML instead of code block) */
  isRichText?: boolean;
  /** Index of the currently selected suggestion in the sidebar */
  selectedSuggestionIndex?: number | null;
  /** Callback when a suggestion is selected by clicking on highlighted text */
  onSuggestionSelect?: (suggestion: Suggestion | null, index: number) => void;
  /** Ref to expose the applySuggestion function to parent */
  applySuggestionRef?: React.MutableRefObject<((index: number) => void) | null>;
  /** Callback when suggestions are removed (applied + any overlapping) */
  onSuggestionsRemoved?: (indices: number[]) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  initialContent,
  suggestions = [],
  visibleIndices = [],
  checkId = 0,
  isBusy = false,
  editorContentRef,
  isRichText = false,
  selectedSuggestionIndex,
  onSuggestionSelect,
  applySuggestionRef,
  onSuggestionsRemoved,
}) => {
  // Track the last checkId to know when to rebuild decorations
  const lastCheckIdRef = useRef<number>(0);

  // Setup lowlight for code highlighting
  const lowlight = createLowlight();
  lowlight.register("xml", xml);
  lowlight.register("markdown", markdown);

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      NodeIdMark,
      IssueHighlights.configure({
        suggestions: [],
        originalHtml: isRichText ? initialContent : undefined,
        onIssueClick: ({ suggestion, index }) => {
          // Notify parent when an issue is clicked in the editor - expand the corresponding sidebar card
          onSuggestionSelect?.(suggestion, index);
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

  // Set initial content
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

  // Rebuild decorations ONLY when a new check is run (checkId changes)
  useEffect(() => {
    if (!editor || checkId === 0) return;

    // Only rebuild when checkId actually changes (new check was run)
    if (checkId !== lastCheckIdRef.current) {
      lastCheckIdRef.current = checkId;

      if (suggestions.length > 0) {
        const originalHtml = isRichText ? initialContent : undefined;
        editor.commands.setSuggestionHighlights(suggestions, originalHtml);
      } else {
        editor.commands.clearSuggestionHighlights();
      }
    }
  }, [editor, checkId, suggestions, isRichText, initialContent]);

  // Update decoration visibility when filters change (without rebuilding)
  useEffect(() => {
    if (!editor || checkId === 0) return;

    // Only update visibility after initial decorations are set
    if (lastCheckIdRef.current > 0) {
      editor.commands.setVisibleSuggestions(visibleIndices);
    }
  }, [editor, checkId, visibleIndices]);

  // Scroll to selected suggestion when it changes
  useEffect(() => {
    if (
      !editor ||
      selectedSuggestionIndex === null ||
      selectedSuggestionIndex === undefined ||
      selectedSuggestionIndex < 0
    ) {
      return;
    }

    // Use the editor command to navigate to this issue by its original index
    editor.commands.goToIssueGroup(selectedSuggestionIndex);
  }, [editor, selectedSuggestionIndex]);

  const contentAsText = useCallback(() => {
    if (!editor) return "";

    if (isRichText) {
      return editor.getHTML();
    }

    const doc = editor.state.doc;
    return doc.textBetween(0, doc.content.size, "\n\n", "\n");
  }, [editor, isRichText]);

  // Expose content getter to parent via ref
  useEffect(() => {
    if (editorContentRef) {
      editorContentRef.current = contentAsText;
    }
  }, [editorContentRef, contentAsText]);

  // Expose applySuggestion function to parent via ref
  // Note: The parent (FieldCheckDialog) tracks applied count via handleApplySuggestion
  const applySuggestion = useCallback(
    (index: number) => {
      if (!editor) return;

      // Find the target suggestion to get its position for overlap detection
      // Safety check: index may be out of bounds
      if (index < 0 || index >= suggestions.length) return;
      const targetSuggestion = suggestions[index];

      // Calculate end position from start_index + original text length
      const targetFrom = targetSuggestion.position.start_index;
      const targetTo = targetFrom + (targetSuggestion.original.length || 0);

      // Calculate all overlapping indices before applying
      const overlappingIndices = suggestions
        .map((s, i) => ({ suggestion: s, index: i }))
        .filter(({ suggestion }) => {
          const from = suggestion.position.start_index;
          const to = from + (suggestion.original.length || 0);
          // Check if ranges overlap
          return !(to <= targetFrom || from >= targetTo);
        })
        .map(({ index: i }) => i);

      // Apply the suggestion in the editor
      editor.commands.applySuggestionByIndex(index);

      // Notify parent about all removed indices (including overlaps)
      if (onSuggestionsRemoved && overlappingIndices.length > 0) {
        onSuggestionsRemoved(overlappingIndices);
      }
    },
    [editor, suggestions, onSuggestionsRemoved],
  );

  useEffect(() => {
    if (applySuggestionRef) {
      applySuggestionRef.current = applySuggestion;
    }
  }, [applySuggestionRef, applySuggestion]);

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

    // Plain text
    const lines = text.split("\n");
    const nodes: JSONContent[] = [];
    lines.forEach((line, idx) => {
      if (idx > 0) {
        nodes.push({ type: "hardBreak" });
      }
      if (line.length > 0) {
        nodes.push({ type: "text", text: line });
      }
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
              <Text>Analyzing content...</Text>
            </LoadingContent>
          </LoadingOverlay>
        )}
      </EditorContainer>
    </PanelContainer>
  );
};
