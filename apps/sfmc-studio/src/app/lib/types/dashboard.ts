export type ContactCounts = {
  totalContacts: number;
  newContacts: number;
};

export type RoiConversionCounts = {
  cardText: string;
  countData: {
    count: number;
    change: number;
  };
  currencySign?: string;
  icon: string;
  toolTipText: string;
};

export type TopSoldProductsType = {
  category: string;
  date: string;
  revenue: number;
  color: string;
};

export type TopSourceMediumRevenueType = {
  color: string;
  name: string;
  revenue: number;
  labelColor: string;
  displayRevenue: string;
  CurrencyIsoCode: string;
};

export type TopRevenueCityType = {
  name: string;
  revenue: number;
  color?: string;
  CurrencyIsoCode: string;
};

export type TopRevenueOrderT = {
  Type: string;
  date: string;
  revenue: number;
  color: string;
  CurrencyIsoCode: string;
};

export type TopCitiesType = {
  color: string;
  name: string;
  count: number;
  labelColor: string;
};

export type TopOrders = {
  Type: string;
  Date: string;
  count: number;
};

interface Count {
  count: number;
  change: number;
}

export type CountDataType = {
  count: Count;
  cardText: string;
  icon: string;
  toolTipText: string;
};

export type CampaignSentsType = {
  key: React.Key;
  no: number;
  name: string;
  sents: number;
  displaySents: string;
};

export type CampaignOpenType = {
  key: React.Key;
  no: number;
  name: string;
  opens: number;
  displayOpens: string;
};

export type CampaignClicksType = {
  key: React.Key;
  no: number;
  name: string;
  clicks: number;
  displayClicks: string;
};

export type CampaignClicksSentsOpensType = {
  key: React.Key;
  no: number;
  name: string;
  clicks: number;
  opens: number;
  sents: number;
  displayClicks: string;
  displayOpens: string;
  displaySents: string;
};

export type ByDayWeekType = {
  key: React.Key;
  no: number;
  weekday: string;
  unique: number;
};

export type CampaignClicksUniqueType = {
  name: string;
  clicks: number;
  color: string;
  labelColor: string;
};

export type RevenueBySourceRetention = {
  color: string;
  name: string;
  revenue: number;
  CurrencyIsoCode: string;
};

export type RetentionCounts = {
  cardText: string;
  countData: {
    count: number;
    change: number;
  };
  currencySign?: string;
  icon: string;
  toolTipText: string;
};

export type OrderByStatusRetention = {
  color: string;
  count: number;
  status: string;
};

export type TopProductRevenueRetention = {
  color: string;
  productName: string;
  revenue: number;
  labelColor: string;
  displayRevenue: string;
  CurrencyIsoCode: string;
};
export type TopProductSkuType = {
  color: string;
  productSKU: string;
  revenue: number;
  labelColor: string;
  displayRevenue: string;
  CurrencyIsoCode: string;
};

export interface SoldProductsRetention {
  key?: string;
  productName: string;
  productUrl?: string;
  productFamily: string;
  soldAmount: number;
  revenue: number;
  displaySoldAmount: string;
}
