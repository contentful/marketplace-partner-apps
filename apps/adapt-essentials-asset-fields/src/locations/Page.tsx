import { Box, GlobalStyles, Header } from '@contentful/f36-components';
import { Layout } from '@contentful/f36-layout';

import { Provider } from '../components/context/createFastContext';
import Dashboard from '../components/Dashboard';
import { WorkbenchActions } from '../components/WorkbenchActions';
import styles from './styles.module.css';

const Page = () => {
  return (
    <Provider>
      <GlobalStyles />
      <Layout
        offsetTop={0}
        header={
          <Layout.Header>
            <Header title="Adapt Essentials: Asset Fields" className={styles.header}></Header>
          </Layout.Header>
        }>
        <Layout.Body>
          <Box className={styles.page}>
            <WorkbenchActions />
            <Box marginTop="spacingXl">
              <Dashboard />
            </Box>
          </Box>
        </Layout.Body>
      </Layout>
    </Provider>
  );
};

export default Page;
