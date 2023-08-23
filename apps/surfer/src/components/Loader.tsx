import { Flex, Spinner } from '@contentful/f36-components';

export const Loader = ({ isLoading }: { isLoading: boolean }) => (
  <>
    {isLoading && (
      <Flex alignItems="center" justifyContent="center" flexDirection="column" fullHeight>
        <Spinner variant="primary" />
      </Flex>
    )}
  </>
);
