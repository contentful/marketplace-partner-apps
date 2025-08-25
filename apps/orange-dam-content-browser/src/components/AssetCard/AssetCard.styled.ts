import styled from 'styled-components';

import { CxCardProps } from '@/react-web-component';

export const Card = styled('cx-card')<CxCardProps>`
  &.asset-card {
    --border-color: transparent;
    --border-radius: 0;
    --border-width: 0;
    --padding: 0;
    --image-border-radius: var(--cx-border-radius-medium);

    &::part(base) {
      box-shadow: none;
      cursor: pointer;
      overflow: hidden;
    }

    &::part(image) {
      aspect-ratio: 246/180;
      position: relative;
    }

    &::part(body) {
      padding: var(--cx-spacing-x-small);
    }

    &.selected {
      --border-color: var(--cx-color-primary);
    }

    cx-divider {
      --color: var(--cx-color-neutral-500);
      --spacing: 0;
      --width: 10px;
    }

    cx-space {
      justify-content: space-between;
    }
  }

  .asset-card__delete {
    border-radius: var(--cx-border-radius-circle);
    position: absolute;
    top: var(--cx-spacing-3x-small);
    right: var(--cx-spacing-3x-small);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    z-index: var(--cx-z-index-drawer);

    cx-icon-button {
      color: var(--cx-color-danger-300);
    }

    &:hover cx-icon-button {
      color: var(--cx-color-danger-700);
    }
  }

  .asset-card__name {
    flex: 1;
    font-size: var(--cx-font-size-small);

    &::part(content) {
      word-break: break-all;
    }
  }

  .asset-card__name--right {
    text-align: right;
  }

  .asset-card__button {
    &::part(base) {
      font-size: var(--cx-font-size-medium);
      padding: 0;
    }
  }

  .asset-card__tags {
    /* display: flex;
    gap: var(--cx-spacing-3x-small); */
    width: 100%;
    height: 24px;

    cx-tag {
      max-width: 100%;
    }
  }

  .asset-card__secondary-info {
    color: var(--cx-color-neutral-500);
    * {
      line-height: var(--cx-line-height-small);
    }
    .asset-card__placeholder {
      visibility: hidden;
    }
  }
`;

export default Card;