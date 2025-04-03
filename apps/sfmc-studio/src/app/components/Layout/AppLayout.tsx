'use client';
import React, { useState } from 'react';
import { Layout } from 'antd';
import SidebarMenuItems from './SidebarMenuItems';
import RightLayout from './RightLayout';
import { useAppSelector } from '../../redux/hooks';
const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { loaderSlice, themeSlice } = useAppSelector((state) => state);

  return (
    <>
      <Layout className={`MainLayout ${loaderSlice.loading ? 'MainLayoutFix' : ''}`}>
        <SidebarMenuItems collapsed={collapsed} />
        <Layout className={`RightMainLayout ${themeSlice.theme == 'dark' ? 'dark' : ''}`}>
          <RightLayout collapsed={collapsed} setCollapsed={setCollapsed} />
        </Layout>
      </Layout>
    </>
  );
};

export default App;
