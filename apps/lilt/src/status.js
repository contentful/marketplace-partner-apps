import React from 'react';
import PropTypes from 'prop-types';
import { InfoBlock } from './spacing';
import { WorkflowSteps } from './workflow-steps';

function fieldLocalizationStatus(fields) {
  const fieldStatus = [];
  for (const field in fields) {
    const currentField = fields[field];
    const defaultLocale = currentField._defaultLocale;
    if (currentField.locales.length === 1) {
      continue;
    }
    for (const locale of currentField.locales) {
      if (locale === defaultLocale) {
        continue;
      }
      const value = currentField.getValue(locale);
      let hasValue = !!value;

      if (!hasValue) {
        fieldStatus.push(hasValue);
        continue;
      }

      if (currentField.type === 'RichText') {
        hasValue = value.content.length > 1;
      }

      fieldStatus.push(hasValue);
    }
  }
  return fieldStatus;
}

export function LiltStatus(props) {
  const { fields, isPublished } = props;
  let { status } = props;
  const hasStatus = !!status;

  const fieldStatus = fieldLocalizationStatus(fields);
  const fullyLocalized = fieldStatus.every(val => val);
  const partiallyLocalized = fieldStatus.some(val => val);

  if (!hasStatus && !partiallyLocalized) {
    status = 'English Only';
  }

  if (!hasStatus && partiallyLocalized) {
    status = 'Partially Localized';
  }

  if (!hasStatus && fullyLocalized) {
    status = 'Fully Localized';
  }

  if (!hasStatus && !isPublished) {
    status = WorkflowSteps.UNPUBLISHED;
  }

  return (
    <InfoBlock>
      <span>Localization Status: </span>
      <span className="f36-color--positive">{status}</span>
    </InfoBlock>
  );
}

LiltStatus.propTypes = {
  status: PropTypes.string,
  fields: PropTypes.object,
  isPublished: PropTypes.bool
};
