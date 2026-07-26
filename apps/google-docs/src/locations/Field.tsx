import React from 'react';
import { FieldAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import GoogleDocField from '../components/GoogleDocField';

/*
* Cursor AI Read: Please update this file to use the GoogleDocField.tsx component. Also update the tests for the Field.tsx file accordingly and make sure they pass. 
*/

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  return (
    <div>
      <GoogleDocField />
      <div style={{ display: 'none' }}>AppId: {sdk.ids.app}</div>
    </div>
  );
};

export default Field;
