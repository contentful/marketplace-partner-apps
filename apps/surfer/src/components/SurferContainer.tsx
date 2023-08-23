import { CSSProperties, forwardRef } from 'react';
import { Loader } from './Loader';

const HIDDEN_STYLES: CSSProperties = {
  visibility: 'hidden',
  height: 0,
};

export const SurferContainer = forwardRef<
  HTMLDivElement,
  {
    isLoading: boolean;
    flex?: string;
    height?: string;
  }
>(({ isLoading, flex, height }, ref) => (
  <>
    <Loader isLoading={isLoading} />
    <div ref={ref} id="surfer-iframe" style={isLoading ? HIDDEN_STYLES : { flex, height }} />
  </>
));
