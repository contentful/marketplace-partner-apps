import { eDataExtensionParams, getPercentChange } from "@/lib/Constants";
import { defaultDateRange } from "@/lib/helpers/DateHelpers";
import connectDB, { dataExtensionsMap } from "@/lib/helpers/DBHelpers";
import { defaultSystemTZ } from "@/lib/utils/common";
import { Contact } from "@/model/contacts";
import { Order } from "@/model/orders";

export const getTotalOrders = async ({
  startDate,
  endDate,
  previousStartDate,
  previousEndDate,
  licenseKey,
}: {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  licenseKey: string;
}) => {
  //calculation for totalOrders //Count of orders
  const totalOrders = {
    count: 0,
    change: 0,
  };

  let totalOrdersAgr = (startDate: string, endDate: string) => [
    {
      $match: {
        EffectiveDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        licenseKey: licenseKey,
      },
    },
    {
      $count: "count",
    },
  ];

  const orderCountRes = await Order.aggregate(
    totalOrdersAgr(startDate, endDate)
  );
  totalOrders.count = +orderCountRes?.[0]?.count?.toFixed(2) ?? 0;

  const previousOrderCountRes = await Order.aggregate(
    totalOrdersAgr(previousStartDate, previousEndDate)
  );
  let prevOrderCount = previousOrderCountRes?.[0]?.count ?? 0;

  const orderCountPercentChange = getPercentChange(
    totalOrders.count,
    prevOrderCount
  );

  totalOrders.change = Number.isFinite(orderCountPercentChange)
    ? orderCountPercentChange
    : 0;

  return { ...totalOrders, prevOrderCount };
};

export const getTotalAmountRevenue = async ({
  startDate,
  endDate,
  previousStartDate,
  previousEndDate,
  licenseKey,
}: {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  licenseKey: string;
}) => {
  //calculation for totalAmount //Sum of TotalAmount of orders

  let totalAmount = {
    count: 0,
    change: 0,
    currency: "",
  };

  let totalAmountAgr = (startDate: string, endDate: string) => [
    {
      $match: {
        licenseKey: licenseKey,
        EffectiveDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        TotalAmount: {
          $sum: "$TotalAmount",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
  ];

  const totalAmountRes = await Order.aggregate(
    totalAmountAgr(startDate, endDate)
  );

  totalAmount.count = +totalAmountRes?.[0]?.TotalAmount?.toFixed(2) ?? 0;
  totalAmount.currency = totalAmountRes?.[0]?.CurrencyIsoCode;

  const previousTotalAmountRes = await Order.aggregate(
    totalAmountAgr(previousStartDate, previousEndDate)
  );
  let prevTotalAmount = previousTotalAmountRes?.[0]?.TotalAmount ?? 0;

  const amountPercentChange = getPercentChange(
    totalAmount.count,
    prevTotalAmount
  );

  totalAmount.change = Number.isFinite(amountPercentChange)
    ? amountPercentChange
    : 0;
  return totalAmount;
};

export const getTotalContacts = async ({
  localStartDate,
  localEndDate,
  previousLocalStartDate,
  previousLocalEndDate,
  licenseKey,
}: {
  localStartDate: string;
  localEndDate: string;
  previousLocalStartDate: string;
  previousLocalEndDate: string;
  licenseKey: string;
}) => {
  //calculation for Total Contacts (within a specific timeframe)
  const newClients = {
    count: 0,
    change: 0,
  };

  let totalContactsAgr = (localStartDate: string, localEndDate: string) => [
    {
      $match: {
        CreatedDate: {
          $gte: new Date(localStartDate),
          $lte: new Date(localEndDate),
        },
        licenseKey: licenseKey,
      },
    },
    {
      $count: "count",
    },
  ];
  const contactsCountRes = await Contact.aggregate(
    totalContactsAgr(localStartDate, localEndDate)
  );
  newClients.count = +contactsCountRes?.[0]?.count?.toFixed(2) ?? 0;

  const previousContactsCountRes = await Contact.aggregate(
    totalContactsAgr(previousLocalStartDate, previousLocalEndDate)
  );
  let prevClientsCount = previousContactsCountRes?.[0]?.count ?? 0;

  const clientsCountPercentChange = getPercentChange(
    newClients.count,
    prevClientsCount
  );

  newClients.change = Number.isFinite(clientsCountPercentChange)
    ? clientsCountPercentChange
    : 0;
  return newClients;
};

/**
 * Common controller function used to fetch data for
 * Top Campaign Sents and Top Campaign Opens tables
 */
export const getTopCampaignTablesData = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  dataExtensionParam,
  clientTZ = defaultSystemTZ,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  dataExtensionParam: eDataExtensionParams;
  clientTZ?: string;
}) => {
  await connectDB();

  let aggrField = "";
  let dbModel = dataExtensionsMap.find(
    (extMap) => extMap.extension === dataExtensionParam
  )?.dbModel;

  switch (dataExtensionParam) {
    case eDataExtensionParams.SENTS:
      aggrField = "sents";
      break;
    case eDataExtensionParams.OPENS:
      aggrField = "opens";
      break;
    default:
      break;
  }

  const topCampaignData = await dbModel!.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        "values.date": {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: "$values.campaign",
        [aggrField]: { $sum: { $toInt: `$values.${[aggrField]}` } },
      },
    },
    {
      $sort: { [aggrField]: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  let campaignData = topCampaignData
    .sort((a: any, b: any) => topCampaignData[b] - topCampaignData[a])
    .map(({ _id, ...fields }) => ({ name: _id, ...fields }));

  return campaignData;
};
