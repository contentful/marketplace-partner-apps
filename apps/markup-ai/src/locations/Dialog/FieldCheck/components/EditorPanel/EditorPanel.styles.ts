/**
 * Styles for EditorPanel component (simplified)
 */

import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

export const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: ${tokens.colorWhite};
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

export const EditorContainer = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: ${tokens.colorWhite};

  .ProseMirror {
    padding: ${tokens.spacingM};
    min-height: 100%;
    outline: none;
    font-family: ${tokens.fontStackPrimary};
    font-size: ${tokens.fontSizeM};
    line-height: 1.8;

    p {
      margin: 0 0 ${tokens.spacingS} 0;
    }

    pre {
      background: ${tokens.gray100};
      border-radius: ${tokens.borderRadiusSmall};
      padding: ${tokens.spacingS};
      overflow-x: auto;

      code {
        font-family: ${tokens.fontStackMonospace};
      }
    }
  }

  /* Issue highlight styles */
  .wp-issue-underline {
    cursor: pointer;
  }

  .wp-issue-active-bg {
    background-color: rgba(239, 68, 68, 0.15);
    border-radius: 2px;
  }
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
`;

export const LoadingContent = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingS};
  padding: ${tokens.spacingM};
  background: ${tokens.colorWhite};
  border-radius: ${tokens.borderRadiusMedium};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;
