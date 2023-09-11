import React from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { locations } from '@contentful/app-sdk';
import FieldView from './locations/FieldView';
import DialogView from './locations/DialogView';
import ConfigScreen from './locations/ConfigScreen';
import { ALLOWED_RESOURCE_TYPES } from '../contentful-constants';

const ViewSelector = () => {
  const sdk = useSDK();

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    return <ConfigScreen />;
  }

  if (sdk.location.is(locations.LOCATION_ENTRY_FIELD)) {
    return (
      <>
        <FieldView resourceType={ALLOWED_RESOURCE_TYPES.CAMPAIGNS} />
        <FieldView resourceType={ALLOWED_RESOURCE_TYPES.EARNING_RULES} />
        <FieldView resourceType={ALLOWED_RESOURCE_TYPES.PROMOTION_TIERS} />
      </>
    );
  }

  if (sdk.location.is(locations.LOCATION_DIALOG)) {
    return <DialogView />;
  }
};
export default ViewSelector;
