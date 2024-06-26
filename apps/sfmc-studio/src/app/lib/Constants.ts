import moment from "moment";

export enum EnvVars {
  SFMC_BASE_URL = "SFMC_BASE_URL",
  SFMC_AUTH_URL = "SFMC_AUTH_URL",
  SFMC_SOAP_SERVICE_URL = "SFMC_SOAP_SERVICE_URL",
}

export enum eSFMCQueryParams {
  SENTS_QUERY = "",
  BOUNCES_QUERY = "",
  CLICKS_QUERY = "",
  OPENS_QUERY = "",
  SUBSCRIBERS_QUERY = "",
  UNSUBSCRIBERS_QUERY = "",
}

export enum eSFDCQueryParams {
  ACCOUNT_WITH_ALL_ATTRIBUTES = `SELECT Id,AccountSource,RecordTypeId,City__c,CreatedDate,NAME,Current_Age__c,AnnualRevenue,Maximum_Pack_Size__c,Mailchimp_unsubscribe_time__c,Mailchimp_unsubscribe_campaing_title__c,Unique_Brand_Brewer__c,StateOrProvince_Code__c,PersonBirthdate,Is_Guest__c,PersonMailingAddress,Mailchimp_Marketing_Permission__c,Unsubscribed_Date__pc,Mailchimp_tags__c,PersonLeadSource,Mailchimp_unsubscribe_campaign_id__c,PersonHasOptedOutOfEmail,Max_Brewer_Name__c FROM+Account`,
  SALES_CLOUD_ORDER_QUERY = "SELECT+Id,TotalAmount,EffectiveDate,CreatedDate,BillingCity,BillingCountry,Status,Type,Account.AccountSource+FROM+ORDER",
  SALES_CLOUD_CONTACTS_QUERY = "SELECT+Id, CreatedDate,HasOptedOutOfEmail+FROM+Contact",
  SALES_CLOUD_ORDER_ITEM_QUERY = "SELECT+Id,CreatedDate,Quantity,Product2Id,TotalPrice,Product2.Name,Product2.DisplayUrl,Product2.StockKeepingUnit,Product2.Family,Order.EffectiveDate+FROM+OrderItem",
}

export enum eDataExtensionKey {
  SENTS = "sents",
  BOUNCES = "bounces",
  CLICKS = "clicks",
  OPENS = "opens",
  SUBSCRIBERS = "subscribers",
  UNSUBSCRIBERS = "unsubscribers",
  DELIVERIES = "deliveries",
  UNIQUE_CLICKS = "uniqueClicks",
  UNIQUE_OPENS = "uniqueOpens",
  CTR = "ctr",
  ACCOUNTS = "accounts",
  CONTACTS = "contacts",
  ORDERS = "orders",
  ORDER_ITEMS = "orderItems",
  NEW_CONTACT_CLICKS = "newContactClicks",
  NEW_CONTACT_OPENS = "newContactOpens",
  NEW_CONTACT_SENTS = "newContactSents",
  CAMPAIGN_CLICKS = "campaignClicks",
  CAMPAIGN_SENTS = "campaignSents",
  CAMPAIGN_OPENS = "campaignOpens",
  CAMPAIGN_UNIQUE_OPEN = "campaignUniqueOpen",
}

export enum eDataExtensionParams {
  SENTS = "SFMC_Studio_Sents",
  BOUNCES = "SFMC_Studio_Bounce",
  CLICKS = "SFMC_Studio_Clicks",
  OPENS = "SFMC_Studio_Opens",
  SUBSCRIBERS = "SFMC_Studio_Subscribers",
  UNSUBSCRIBERS = "SFMC_Studio_Unsubscribers",
}

export enum eClickCountType {
  UNIQUE_CLICKS = "uniqueClicks",
  CLICK_RATE = "clickRate",
  CLICK_TO_OPEN_RATE = "clickToOpenRate",
}

export enum eDateFormats {
  SFMC_COMMON_DATASETS_DATE = "YYYY-MM-DD HH:mm:ss Z",
  ORDERS_CREATED_DATE = "YYYY-MM-DDTHH:mm:ss.SSSZ",
  ORDER_ITEMS_CREATED_DATE = "YYYY-MM-DDTHH:mm:ss.SSSZ",
  CONTACTS_CREATED_DATE = "YYYY-MM-DDTHH:mm:ss.SSSZ",
  CONVERSION_FMT_DATE = "YYYY-MM-DDTHH:mm:ss.SSS",
}

export const dataExtensionsWithJoinDate = ["subscribers"];

export const Weekdays = {
  "1": "Sunday",
  "2": "Monday",
  "3": "Tuesday",
  "4": "Wednesday",
  "5": "Thursday",
  "6": "Friday",
  "7": "Saturday",
};

export const dbInsertionBatchSize = +(process.env.DATABASE_BATCH_SIZE ?? 1000);
export const queryConcurrentConnections = +(
  process.env.QUERY_CONCURRENT_CONNECTIONS ?? 100
);

export const protectedRoutes: string[] = ["dashboard", "sync"];

export const epsilon = 0.000001;

export enum eDataExtensionStatus {
  OK = "OK",
  Error = "Error",
}

export enum eContentfulWebhooks {
  APP_INSTALLATION = "AppInstallation",
  APP_UNINSTALLATION = "DeletedAppInstallation",
}

export const getPercentChange = (newCount: number, previousCount: number) => {
  newCount = Number.isFinite(newCount) ? newCount : 0;
  previousCount = Number.isFinite(previousCount) ? previousCount : 0;
  if (previousCount === 0 && newCount !== 0) {
    // this condition is written as escape code for values where previousCount === 0 && newCount !== 0
    // because it can return high percent change in case newCount is a high number
    return newCount;
  }
  return +(
    ((newCount - previousCount) / (previousCount + epsilon)) *
    100
  ).toFixed(2);
};

export enum themeTextColor {
  dark = "white",
  light = "#111B2B",
}
export const getPreviousRange = (startDate: string, endDate: string) => {
  const dayDiff = moment(endDate).diff(startDate, "days");
  const numberOfDays = dayDiff ? dayDiff : dayDiff + 1;

  const previousStartDate = moment(startDate)
    .subtract(numberOfDays, "days")
    .toISOString();
  const previousEndDate = moment(endDate)
    .subtract(numberOfDays, "days")
    .toISOString();

  return { previousStartDate, previousEndDate };
};

export const licenseKeyValidationEndpoint = `${process.env.CTF_MARKETING_WEBSITE_URL}/api/integrate`;
export const unlinkSpaceIdEndpoint = `${process.env.CTF_MARKETING_WEBSITE_URL}/api/`;
