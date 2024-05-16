import { Box } from '@contentful/f36-components';
import { Workbench } from '@contentful/f36-workbench';

import { Provider } from '../components/context/createFastContext';
import Dashboard from '../components/Dashboard';
import { WorkbenchActions } from '../components/WorkbenchActions';

const Page = () => {
  return (
    <Provider>
      <Workbench>
        <Workbench.Header title="Adapt Essentials: Asset Fields" actions={<WorkbenchActions />} />
        <Workbench.Content>
          <Box marginTop="spacingXl" className="page">
            <Dashboard />
          </Box>
        </Workbench.Content>
      </Workbench>
    </Provider>
  );
};

export default Page;
