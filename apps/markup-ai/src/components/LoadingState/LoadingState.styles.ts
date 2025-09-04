import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const bounce = keyframes`
  0%, 100% { 
    transform: translateY(0);
  } 
  50% { 
    transform: translateY(-4px);
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px;
  gap: 5px;
  width: 100%;
`;

export const LoadingDots = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 5px;
`;

export const LoadingDot = styled.div`
  width: 6px;
  height: 6px;
  background-color: #5a657c;
  border-radius: 50%;
  animation: ${bounce} 0.6s ease-in-out infinite;

  &:nth-of-type(1) {
    animation-delay: 0s;
  }

  &:nth-of-type(2) {
    animation-delay: 0.2s;
  }

  &:nth-of-type(3) {
    animation-delay: 0.4s;
  }
`;
