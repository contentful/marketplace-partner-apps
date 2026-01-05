import styled from "@emotion/styled";
import { Text } from "@contentful/f36-components";

export const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 0 10px 0;
  gap: 5px;
  width: 100%;
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  gap: 20px;
`;

export const MetricGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
`;

export const MetricRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export const Label = styled(Text)`
  font-family: "Geist", sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 24px;
  letter-spacing: 0px;
  color: #111b2b;
  margin: 0;
  padding: 0;
`;

export const Score = styled(Text)`
  font-family: "Geist", sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #111b2b;
  min-width: 24px;
  text-align: right;
`;

export const BarTrack = styled.div`
  width: 100%;
  height: 4px;
  background-color: #e7ebee;
  border-radius: 2px;
  overflow: hidden;
`;

export const BarFill = styled.div<{ color: string; percent: number }>`
  width: ${(props) => props.percent}%;
  height: 100%;
  background-color: ${(props) => props.color};
  border-radius: 2px;
`;

export const ComplexityBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  gap: 2px;
`;

export const ComplexitySegment = styled.div<{ active: boolean }>`
  flex: 1;
  height: 4px;
  background-color: ${(props) => (props.active ? "#40A0FF" : "#e7ebee")};
`;

export const Title = styled(Text)`
  font-family: "Geist", sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 24px;
  color: #111b2b;
  letter-spacing: -0.32px;
  margin: 0;
  padding: 0;
`;
