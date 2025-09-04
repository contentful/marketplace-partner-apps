import styled from '@emotion/styled';

export const DialogContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0px;
  isolation: isolate;
  position: relative;
  min-width: 420px;
  width: 100%;
  max-width: 600px;
  background: #fff;
  box-shadow:
    0px 0px 0px 1px rgba(25, 37, 50, 0.1),
    0px -6px 16px -6px rgba(25, 37, 50, 0.03),
    0px 8px 16px -8px rgba(25, 37, 50, 0.2),
    0px 13px 27px -5px rgba(25, 37, 50, 0.15);
  border-radius: 6px;
`;

export const DialogHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 12px 12px 16px;
  gap: 6px;
  width: 100%;
  height: 45px;
  position: relative;
  z-index: 2;
`;

export const DialogTitle = styled.div`
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 21px;
  letter-spacing: -0.32px;
  color: #111b2b;
  flex: 1;
`;

export const CloseButtonWrapper = styled.div`
  position: absolute;
  right: 16px;
  top: 16px;
`;

export const DialogDivider = styled.div`
  width: 100%;
  height: 1px;
  background: #e7ebee;
  flex: none;
  order: 1;
  align-self: stretch;
  flex-grow: 0;
  z-index: 1;
`;

export const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 16px;
  gap: 8px;
  isolation: isolate;
  width: 100%;
  max-width: 560px;
`;

// Top grid: Quality score card on the left, analysis configuration card on the right
export const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 3fr; /* 25% / 75% */
  gap: 10px;
  width: 100%;
  align-items: stretch;
`;

export const QualityCard = styled.div<{ bg?: string }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  background: ${(p) => p.bg || '#DFF2FF'};
  border: 1px solid #e7ebee;
  height: 76px; /* fixed to match right-side box */
  box-shadow:
    0 2px 6px rgba(17, 27, 43, 0.12),
    0 1px 2px rgba(17, 27, 43, 0.08);
`;

export const QualityTitle = styled.div`
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #111b2b;
`;

export const QualityValue = styled.div`
  margin-top: 4px;
  font-family: 'Geist', sans-serif;
  font-weight: 800;
  font-size: 23px;
  line-height: 1;
  color: #111b2b;
`;

export const SectionTitle = styled.div`
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: #111b2b;
  margin: 8px 0 6px;
`;

export const MetricSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 8px;
  gap: 6px;
  isolation: isolate;
  width: 100%;
  max-width: 100%;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e7ebee;
  margin-bottom: 6px;
  box-shadow: 0 1px 2px rgba(17, 27, 43, 0.05);
`;

export const MetricHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  width: 100%;
`;

export const MetricScore = styled.div<{ color?: string }>`
  font-family: 'Geist', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: ${(p) => p.color || '#111b2b'};
  min-width: 20px;
  text-align: right;
  margin-left: auto;
`;

export const MetricBarTrack = styled.div`
  width: 100%;
  height: 4px;
  background: #e7ebee;
  border-radius: 20px;
  overflow: hidden;
`;

export const MetricBarFill = styled.div<{ color: string; percent: number }>`
  width: ${(props) => Math.max(0, Math.min(100, props.percent))}%;
  height: 4px;
  background: ${(props) => props.color};
  border-radius: 20px;
`;

export const MetricDetailsRow = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  justify-content: start;
  align-items: center;
  column-gap: 8px;
  width: 100%;
  font-family: 'Geist', sans-serif;
  font-size: 12px;
  color: #111b2b;
  margin-top: 2px;
`;

export const MetricDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 10px;
  row-gap: 4px;
  width: 100%;
  margin-top: 4px;
`;

export const MetricLabel = styled.span`
  font-family: 'Geist', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0px;
`;

export const IssuesNumber = styled.span`
  font-family: 'Geist', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 13px;
  line-height: 20px;
  letter-spacing: 0px;
  color: #606060;
`;

export const AnalysisConfigCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 6px 8px;
  width: 100%;
  max-width: 100%;
  background: #ffffff;
  border: 1px solid #e7ebee;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(17, 27, 43, 0.05);
  height: 76px; /* match QualityCard */
  overflow: hidden; /* prevent overflow from increasing height */
`;

export const AnalysisConfigGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
`;

export const AnalysisConfigItem = styled.div`
  display: contents;
`;

export const AnalysisConfigLabel = styled.span`
  font-family: 'Geist', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: #606060;
  padding: 2px 4px;
  border-bottom: none;
`;

export const AnalysisConfigValue = styled.span`
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: #111b2b;
  text-align: right;
  padding: 2px 4px;
  border-bottom: none;
`;

export const BottomActions = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 8px;
`;

export const CopyWorkflowIdButton = styled.button`
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  box-shadow: 0px 1px 0px rgba(17, 27, 43, 0.05);
  cursor: pointer;
  border: 1px solid #cfd9e0;
  background: #fff;
  color: #111b2b;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 160ms ease-in-out;

  &:hover {
    opacity: 0.9;
  }
`;
