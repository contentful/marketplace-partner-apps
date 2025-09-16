import styled from 'styled-components';

export const Container = styled.div`
  &.asset-preview {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.asset-preview > div {
    height: 100%;
  }

  .asset-preview__representative {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    object-fit: contain;
  }

  .asset-preview__representative--animated {
    display: none;
  }

  .asset-preview__representative-container:hover {
    .asset-preview__representative {
      display: none;
    }
    .asset-preview__representative--animated {
      display: block;
    }
  }
  
  .asset-preview__representative--horizontal > * {
    width: 100%;
    height: auto;
  }

  .asset-preview__representative--vertical > * {
    width: auto;
    height: 100%;
  }

  .asset-preview__representative-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: transparent;
    z-index: 1;
  }

  .asset-preview__image-skeleton {
    --border-radius: var(--cx-border-radius-medium);

    aspect-ratio: 246/180;
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }

  .asset-preview__video-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--cx-color-neutral-0);
    font-size: var(--cx-font-size-x-large);
    background-color: color-mix(
      in srgb,
      var(--cx-color-neutral-1000),
      transparent 60%
    );
    border-radius: var(--cx-border-radius-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    pointer-events: none;
  }
  
  .asset-preview__video-icon[hidden] {
    display: none !important;
  }

  .asset-preview__progress-bar {
    --height: 6px;
    
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;

    &::part(indicator) {
      transition: none;
    }
  }
`;
