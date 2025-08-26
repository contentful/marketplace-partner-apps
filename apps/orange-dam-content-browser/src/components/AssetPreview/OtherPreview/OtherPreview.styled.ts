import styled from 'styled-components';

export const Container = styled.div`
  --text-font-size: var(--cx-font-size-medium);
  --icon-font-size: var(--cx-font-size-x-large);
  --gap: var(--cx-spacing-2x-small);

  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--gap);
  background-color: var(--default-representative-background-color);
  color: var(--default-representative-color);
  font-weight: var(--cx-font-weight-medium);
  font-size: var(--text-font-size);

  cx-icon {
    font-size: var(--icon-font-size);
  }
`;
