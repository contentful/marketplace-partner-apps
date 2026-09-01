// src/locations/Sidebar.tsx
import React from "react";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Note, Text } from "@contentful/f36-components";

import PageTree from "../components/PageTree";
import { useAppConfig } from "../core/useAppConfig";

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();

  const {
    config,
    loading: configLoading,
    error: configError,
  } = useAppConfig(sdk);

  if (configLoading) {
    return <Text fontColor="gray600">Loading configuration…</Text>;
  }

  if (configError) {
    return (
      <Note variant="negative" title="Configuration error">
        {configError}
      </Note>
    );
  }

  return <PageTree sdk={sdk} config={config} />;
};

export default Sidebar;
