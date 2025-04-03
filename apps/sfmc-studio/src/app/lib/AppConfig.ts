export enum AppInstallationParametersKeys {
  LICENSE_KEY = 'licenseKey',
  COMPANY_NAME = 'companyName',
  COMPANY_LOGO_URL = 'companyLogoUrl',
  SFMC_DOMAIN = 'sfmcDomain',
  SFMC_MARKETING_ID = 'sfmcMarketingId',
  SFMC_CLIENT_ID = 'sfmcclientId',
  SFMC_CLIENT_SECRET = 'sfmcclientSecret',
  SFMC_TIMEZONE = 'sfmcTimezone',
  SFSC_URL = 'sfscUrl',
  SFSC_CLIENT_ID = 'sfscclientId',
  SFSC_CLIENT_SECRET = 'sfscclientSecret',
  SFSC_USERNAME = 'sfscUsername',
  SFSC_PASSWORD = 'sfscPassword',
  SFSC_TIMEZONE = 'sfscTimezone',
  SFMC_SYNC = 'sfmcSync',
}

export const appInstallationParameters = {
  [AppInstallationParametersKeys.LICENSE_KEY]: '',
  [AppInstallationParametersKeys.COMPANY_NAME]: '',
  [AppInstallationParametersKeys.COMPANY_LOGO_URL]: '',
  [AppInstallationParametersKeys.SFMC_DOMAIN]: '',
  [AppInstallationParametersKeys.SFMC_MARKETING_ID]: '',
  [AppInstallationParametersKeys.SFMC_CLIENT_ID]: '',
  [AppInstallationParametersKeys.SFMC_CLIENT_SECRET]: '',
  [AppInstallationParametersKeys.SFMC_TIMEZONE]: 'Etc/GMT+6',
  [AppInstallationParametersKeys.SFSC_URL]: '',
  [AppInstallationParametersKeys.SFSC_CLIENT_ID]: '',
  [AppInstallationParametersKeys.SFSC_CLIENT_SECRET]: '',
  [AppInstallationParametersKeys.SFSC_USERNAME]: '',
  [AppInstallationParametersKeys.SFSC_PASSWORD]: '',
  [AppInstallationParametersKeys.SFSC_TIMEZONE]: 'America/New_York',
  [AppInstallationParametersKeys.SFMC_SYNC]: false,
};

export enum navigationParameters {
  Customer_Acquistion = 'Customer_Acquistion',
  Customer_Engagement = 'Customer_Engagement',
  Customer_Retention = 'Customer_Retention',
  Demographical_Report = 'Demographical_Report',
  ROI_Conversion = 'ROI_Conversion',
  Message_Deliverability = 'Message_Deliverability',
}

// type AppInstallationParametersKeys = keyof typeof eAppInstallationParameters;
