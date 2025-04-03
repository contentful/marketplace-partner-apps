'use client';
import React from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import AppLayout from '../../components/Layout/AppLayout';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  return <AppLayout></AppLayout>;
};

export default Page;
