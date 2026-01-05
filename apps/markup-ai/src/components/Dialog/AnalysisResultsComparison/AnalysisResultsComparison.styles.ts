import styled from "@emotion/styled";

export const Container = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, auto);
  gap: 10px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
`;

export const Card = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  gap: 6px;
  width: 100%;
  height: 36px;
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
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
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

export const Value = styled.span`
  min-width: 48px;
  max-width: 60px;
  height: 16px;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: #5a657c;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
`;

export const ImprovedValue = styled(Value)`
  font-weight: 700;
`;

export const Diff = styled.span`
  min-width: 28px;
  height: 16px;
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 16px;
  color: #5a657c;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
`;

export const Arrow = styled.span`
  width: 10.67px;
  height: 10.67px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
