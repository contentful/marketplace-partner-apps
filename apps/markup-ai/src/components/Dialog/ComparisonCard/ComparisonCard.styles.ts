import styled from '@emotion/styled';

export const Card = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  gap: 6px;
  width: 100%;
  height: auto;
  background: #f7f9fa;
  border-radius: 6px;
  flex: none;
  order: 1;
  flex-grow: 1;
  box-sizing: border-box;
  overflow: hidden;
`;

export const Label = styled.div`
  min-width: 0;
  flex: 1 1 0;
  height: 16px;
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  font-style: normal;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0;
  color: #111b2b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ValueGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
`;

const BaseText = styled.span`
  height: 16px;
  font-size: 12px;
  line-height: 16px;
  color: #5a657c;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
`;

export const Value = styled(BaseText)`
  min-width: 48px;
  max-width: 60px;
  font-weight: 500;
  text-align: right;
`;

export const ImprovedValue = styled(Value)`
  font-weight: 700;
`;

export const Diff = styled(BaseText)`
  min-width: 28px;
  font-style: normal;
  font-weight: 500;
  text-align: center;
`;

export const Arrow = styled.span`
  width: 10.67px;
  height: 10.67px;
  display: flex;
  margin-left: 5px;
  align-items: center;
  justify-content: center;
`;
