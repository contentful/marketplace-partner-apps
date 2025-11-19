import styled from '@emotion/styled';
import { Box } from '@contentful/f36-components';

export const SidebarContainer = styled(Box)`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  position: relative;
`;

export const TopBar = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 2px 4px;
  gap: 4px;
  min-height: 20px;
`;
