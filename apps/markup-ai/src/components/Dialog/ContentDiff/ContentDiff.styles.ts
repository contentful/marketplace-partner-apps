import styled from '@emotion/styled';

export const ContentDiffWrapper = styled.div`
  display: flex;
  gap: 30px;
  flex: 1;
  max-height: 600px;
`;

export const ContentBlock = styled.div`
  flex: 1;
  background: #fff;
  border-radius: 6px;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  max-height: 550px;
  overflow: hidden;
`;

export const ContentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0;
  margin-bottom: 12px;
`;

export const ContentTitle = styled.span`
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 100%;
  letter-spacing: -0.32px;
  color: #111b2b;
`;

export const ScoreBadge = styled.span<{ background: string }>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 5px 15px;
  gap: 5px;
  width: 94px;
  height: 30px;
  background: ${({ background }) => background};
  border-radius: 30px;
  flex: none;
  order: 1;
  flex-grow: 0;
`;

export const ScoreText = styled.span`
  font-family: 'Geist', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 13px;
  letter-spacing: 0.1px;
  color: #000;
  width: 34px;
  height: 13px;
  display: flex;
  align-items: center;
  text-align: center;
  flex: none;
  order: 0;
  flex-grow: 0;
`;

export const ScoreNumber = styled.span`
  font-family: 'Geist', sans-serif;
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 13px;
  letter-spacing: 0.1px;
  color: #000;
  width: 25px;
  height: 13px;
  display: flex;
  align-items: center;
  text-align: center;
  flex: none;
  order: 1;
  flex-grow: 0;
`;

export const ContentText = styled.div`
  font-size: 16px;
  color: #111b2b;
  line-height: 24px;
  overflow-y: auto;
  flex: 1;
`;

export const DiffText = styled.span<{ isRemoved?: boolean; isAdded?: boolean }>`
  text-decoration: ${(props) => (props.isRemoved ? 'line-through' : 'none')};
  color: ${(props) => (props.isRemoved ? '#FF707D' : 'inherit')};
  background: ${(props) => (props.isAdded ? '#EAF9E8' : 'none')};
  font-weight: ${(props) => (props.isAdded ? 500 : 'normal')};
`;

export const MergeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
`;

export const MergeHost = styled.div<{ $hidden?: boolean; $heightPx?: number }>`
  height: ${({ $heightPx }) => ($heightPx ? `${$heightPx}px` : '400px')};
  border: 1px solid #e7ebee;
  border-radius: 8px;
  overflow: hidden;
  display: ${({ $hidden }) => ($hidden ? 'none' : 'block')};
  /* Ensure the merge view and internal editors stretch and scroll */
  .cm-mergeView {
    height: 100%;
  }
  .cm-mergeViewEditor {
    height: 100%;
  }
  .cm-editor {
    height: 100%;
    display: flex;
    background: #ffffff;
  }
  .cm-editor .cm-scroller {
    height: 100%;
    overflow: auto;
  }
  /* Force both panes to have white background and remove default red/green highlights */
  .cm-content {
    background: #ffffff !important;
  }
  .cm-change,
  .cm-inserted,
  .cm-removed,
  .cm-deletedChunk,
  .cm-insertedChunk,
  .cm-changedLine {
    background: transparent !important;
  }
`;

export const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const HeaderSide = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PaneHeadersRow = styled.div`
  display: flex;
  gap: 30px;
`;

export const PaneHeader = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 4px;
`;

export const PaneLabel = styled.span`
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 100%;
  letter-spacing: -0.32px;
  color: #111b2b;
`;

export const PreviewContainer = styled.div`
  border: 1px solid #e7ebee;
  border-radius: 8px;
  padding: 12px;
  max-height: 280px;
  overflow: auto;
  background: #fafafa;
  /* Improve readability for rendered Markdown */
  p {
    margin: 0 0 12px 0;
  }
  p:last-child {
    margin-bottom: 0;
  }
  ul,
  ol {
    margin: 0 0 12px 24px;
    padding: 0 0 0 4px;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 12px 0 8px 0;
    line-height: 1.25;
  }
  blockquote {
    margin: 12px 0;
    padding-left: 12px;
    border-left: 3px solid #e7ebee;
    color: #5a657c;
  }
  pre {
    background: #f3f5f7;
    padding: 10px;
    border-radius: 6px;
    overflow: auto;
  }
`;
