import React from "react";
import { Text } from "@contentful/f36-components";
import { LoadingContainer, LoadingDots, LoadingDot } from "./LoadingState.styles";

interface LoadingStateProps {
  message: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <LoadingContainer data-testid="loading-container">
      <LoadingDots data-testid="loading-dots">
        <LoadingDot data-testid="loading-dot" />
        <LoadingDot data-testid="loading-dot" />
        <LoadingDot data-testid="loading-dot" />
      </LoadingDots>
      <Text fontSize="fontSizeM" fontWeight="fontWeightMedium" style={{ color: "#5A657C" }}>
        {message}
      </Text>
    </LoadingContainer>
  );
};
