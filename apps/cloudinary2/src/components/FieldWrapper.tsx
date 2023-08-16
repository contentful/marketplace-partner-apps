import { Flex, FormControl } from '@contentful/f36-components';
import { PropsWithChildren, ReactNode, useId } from 'react';

interface Props {
  name: string;
  description: ReactNode;
  counter?: boolean;
}

export function FieldWrapper({ name, description, counter = false, children }: PropsWithChildren<Props>) {
  return (
    <FormControl id={useId()}>
      <FormControl.Label>{name}</FormControl.Label>
      {children}

      <Flex justifyContent="space-between">
        <FormControl.HelpText>{description}</FormControl.HelpText>
        {counter && <FormControl.Counter />}
      </Flex>
    </FormControl>
  );
}
