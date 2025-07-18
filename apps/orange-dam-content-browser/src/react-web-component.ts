// src/react-web-component.ts
// Type definitions for React props of custom web components

export interface CxCardProps {
  className?: string;
  ref?: React.Ref<any>;
  children?: React.ReactNode;
  'data-testid'?: string;
}
