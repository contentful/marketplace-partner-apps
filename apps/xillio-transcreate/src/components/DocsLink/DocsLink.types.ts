import { TextLinkProps } from '@contentful/f36-components';

export type DocsLinkProps = Omit<TextLinkProps, 'target' | 'href'> & {
  path: string;
};
