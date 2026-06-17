import React, { useEffect, useState } from 'react';
import { Route, BrowserRouter, Navigate, Routes } from 'react-router-dom';

import { Heading, Box } from '@contentful/f36-components';

import ProjectCreation from '../components/Page/ProjectCreation';

import { useCMA } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { PageLayout } from '../components/Page/PageLayout';
import Projects from '../components/Page/ProjectsList';

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
  const cma = useCMA();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);

  useEffect(() => {
    cma.contentType.getMany({}).then((result) => result?.items && setContentTypes(result.items));
  }, [cma.contentType]);

  return (
    <Box className="page" paddingLeft="spacingM" paddingRight="spacingM">
      <Routes>
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Navigate to="/content" replace />} />
          <Route path="/content" element={<ProjectCreation contentTypes={contentTypes} />} />
          <Route path="/projects" element={<Projects contentTypes={contentTypes} />} />
          <Route path="/*" element={<NotFound />} />
        </Route>
      </Routes>
    </Box>
  );
};
