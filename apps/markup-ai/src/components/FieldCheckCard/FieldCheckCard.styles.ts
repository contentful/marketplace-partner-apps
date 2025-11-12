import styled from '@emotion/styled';
import { Box, Flex, Text } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

export const CardContainer = styled(Box)`
  border-radius: ${tokens.borderRadiusMedium};
  background-color: #f7f9fa;
  width: 100%;
  border: 1px solid #e7ebee;
  box-shadow: 0 2px 8px rgba(17, 27, 43, 0.07);
  margin-bottom: 8px;
`;

export const CardWrapper = styled(Box)<{ 'data-expanded': boolean }>`
  background: ${({ 'data-expanded': expanded }) => (expanded ? '#f7f9fa' : 'transparent')};
  border: 1px solid #e7ebee;
  border-radius: 8px;
  width: 100%;
  margin: 0 auto 5px auto;
  box-shadow: 0 2px 8px rgba(17, 27, 43, 0.07);
  padding: ${({ 'data-expanded': expanded }) => (expanded ? '8px 12px 12px' : '8px 12px')};
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: ${({ 'data-expanded': expanded }) => (expanded ? '#f7f9fa' : '#F7F9FA')};
    border-color: #bfc8d1;
    box-shadow: 0 4px 16px rgba(17, 27, 43, 0.1);
  }
`;

export const HeaderFlex = styled(Flex)<{ 'data-clickable'?: boolean }>`
  width: 100%;
  height: 30px;
  align-items: center;
  justify-content: space-between;
  cursor: ${({ 'data-clickable': clickable }) => (clickable ? 'pointer' : 'default')};
`;

export const FieldName = styled(Text)`
  font-family: 'Geist', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #111b2b;
  letter-spacing: -0.32px;
  flex: 1;
`;

export const ScoreBox = styled.div<{ background: string }>`
  width: 30px;
  height: 30px;
  background: ${({ background }) => background};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 13px;
  letter-spacing: 0.1px;
  color: #000;
  margin-left: 8px;
`;

export const ChevronWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-right: 8px;
`;

export const BarTrack = styled.div<{ bar: string }>`
  width: 100%;
  height: 5px;
  background: ${({ bar }) => bar};
  border-radius: 20px;
  position: relative;
`;

export const BarFill = styled.div<{ color: string; percent: number }>`
  height: 5px;
  background: ${({ color }) => color};
  border-radius: 20px;
  width: ${({ percent }) => percent}%;
  position: absolute;
  left: 0;
  top: 0;
`;

export const RewriteButtonBox = styled.div`
  padding-bottom: 12px;
  margin-top: 8px;
  width: 100%;
`;
