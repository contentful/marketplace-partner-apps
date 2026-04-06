
import { Route, BrowserRouter, Routes } from 'react-router-dom';

import { Heading, Box } from '@contentful/f36-components';

import { PageLayout } from '../components/PageLayout';

function NotFound() {
  return <Heading>404</Heading>;
}

export const PageRouter = () => {
  return (
    <BrowserRouter>
      <Page />
    </BrowserRouter>
  );
};

const Page = () => {
  return (
    <Box marginTop="spacingS" className="page">
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
};
