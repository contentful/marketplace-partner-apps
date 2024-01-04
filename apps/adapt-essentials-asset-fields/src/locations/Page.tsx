import { Box, Flex } from '@contentful/f36-components';
import { Workbench } from '@contentful/f36-workbench';

import { Provider } from '../components/context/createFastContext';
import Dashboard from '../components/Dashboard';

const Page = () => {
  return (
    <Workbench>
      <Workbench.Header title="Adapt Essentials: Asset Fields" actions={<Flex gap="2rem" alignItems="center"></Flex>} />
      <Workbench.Content>
        <Box marginTop="spacingXl" className="page">
          <Provider>
            <Dashboard />
          </Provider>
        </Box>
      </Workbench.Content>
    </Workbench>
  );
};

export default Page;
