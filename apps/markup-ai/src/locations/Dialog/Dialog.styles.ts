import styled from "@emotion/styled";

export const DialogContainer = styled.div<{ $fixedHeight?: boolean }>`
  width: 100%;
  max-width: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: ${({ $fixedHeight }) => ($fixedHeight ? "400px" : "auto")};
  min-height: ${({ $fixedHeight }) => ($fixedHeight ? "400px" : "auto")};
  max-height: ${({ $fixedHeight }) => ($fixedHeight ? "400px" : "none")};
`;

export const DialogContent = styled.div`
  padding: 0 24px 24px 24px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
`;

export const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
`;

export const DialogTitle = styled.div`
  font-family: "Geist", sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 32px;
  letter-spacing: 0.38px;
  color: #111b2b;
  margin-bottom: 0;
`;

export const CompanyLogo = styled.img`
  height: 50px;
  width: auto;
  max-width: 200px;
`;

export const CenteredContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
`;

export const ActionsWrapper = styled.div`
  margin-top: auto;
  width: 100%;
`;
