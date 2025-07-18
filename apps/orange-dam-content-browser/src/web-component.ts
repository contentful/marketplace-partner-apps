// src/web-component.ts
// Type definitions for custom web components

export interface CxCard {
  className?: string;
  ref?: any;
  children?: any;
}

export interface CxIconButton {
  onClick?: () => void;
  name?: string;
  size?: string;
  className?: string;
}

export interface CxTooltip {
  content?: string;
  placement?: string;
  distance?: string;
  skidding?: string;
  trigger?: string;
  hoist?: boolean;
  children?: any;
}

export interface CxSpace {
  children?: any;
}

export interface CxProgressBar {
  value?: number;
  max?: number;
  className?: string;
}

// Declare global JSX namespace to include custom elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'cx-card': CxCard & React.HTMLAttributes<HTMLElement>;
      'cx-icon-button': CxIconButton & React.HTMLAttributes<HTMLElement>;
      'cx-tooltip': CxTooltip & React.HTMLAttributes<HTMLElement>;
      'cx-space': CxSpace & React.HTMLAttributes<HTMLElement>;
      'cx-progress-bar': CxProgressBar & React.HTMLAttributes<HTMLElement>;
    }
  }
}
