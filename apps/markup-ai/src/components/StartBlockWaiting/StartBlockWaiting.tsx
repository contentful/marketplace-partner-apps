import React from 'react';
import styled from '@emotion/styled';
import { Text } from '@contentful/f36-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 15px;
  gap: 5px;
  width: 100%;
  height: 99px;
  background: #f7f9fa;
  border-radius: 8px;
  border: 1px solid #e7ebee;
  box-shadow: 0 2px 8px rgba(17, 27, 43, 0.07);
  margin-bottom: 10px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  width: 100%;
`;

const IconWrapper = styled.div``;

const LogoImage = styled.img`
  width: 250px;
  height: 42px;
`;

const StartBlockWaiting: React.FC = () => {
  return (
    <Container data-testid="container">
      <Wrapper data-testid="wrapper">
        <IconWrapper data-testid="icon-wrapper">
          <LogoImage src="logos/markup_Logo_Horz_Coral.svg" alt="Markup AI Logo" />
        </IconWrapper>
        <Text fontSize="fontSizeM" fontWeight="fontWeightMedium" style={{ color: '#5A657C', textAlign: 'center' }}>
          Waiting for user to write, add, or update content
        </Text>
      </Wrapper>
    </Container>
  );
};

export default StartBlockWaiting;
