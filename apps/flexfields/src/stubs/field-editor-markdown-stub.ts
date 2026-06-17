// Stub that satisfies the MarkdownEditor import inside @contentful/default-field-editors/Field.js
// without pulling in codemirror (~400 KB). Markdown fields are rendered as MultipleLineEditor
// in DefaultField.tsx instead; this stub prevents the dead code from entering the bundle.
import React from 'react';

export const MarkdownEditor: React.FC = () => null;
export const MarkdownPreview: React.FC = () => null;
export const openMarkdownDialog = () => {};
export const renderMarkdownDialog = () => {};
