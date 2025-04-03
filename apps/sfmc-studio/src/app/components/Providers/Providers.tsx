'use client';
import { SDKProvider } from '@contentful/react-apps-toolkit';
import React from 'react';

function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SDKProvider>{children}</SDKProvider>;
}

export default Providers;
