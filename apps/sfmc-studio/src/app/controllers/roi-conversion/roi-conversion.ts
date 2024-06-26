import connectDB from "@/lib/helpers/DBHelpers";
import {
  defaultDateRange,
  getLocalDateFromUTCDateTime,
} from "@/lib/helpers/DateHelpers";
import moment from "moment";
import { Order } from "src/app/Model/orders";
import {
  getTotalAmountRevenue,
  getTotalOrders,
} from "../common/common-controllers";
import { Contact } from "@/model/contacts";
import { OrderItem } from "src/app/Model/orderItems";
import { getPercentChange, getPreviousRange } from "@/lib/Constants";
import { defaultSystemTZ } from "@/lib/utils/common";

export const getConversionCounts = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
  sfscTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ?: string;
  sfscTimezone: string;
}) => {
  await connectDB();

  const tz = sfscTimezone;
  const { previousStartDate, previousEndDate } = getPreviousRange(
    startDate,
    endDate
  );

  const localStartDate = getLocalDateFromUTCDateTime(
    startDate,
    tz
  ).toISOString();
  const localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();
  const {
    previousStartDate: previousLocalStartDate,
    previousEndDate: previousLocalEndDate,
  } = getPreviousRange(localStartDate, localEndDate);

  let totalDeliveries = {
    count: 0,
    change: 0,
  };

  // // Calculation for totalDeliveries // Total order where status is 'Completed' or 'Delivered'

  let totalDeliveriesAgr = (startDate: string, endDate: string) => [
    {
      $match: {
        licenseKey: licenseKey,
        EffectiveDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        Status: "Completed",
      },
    },
    {
      $count: "count",
    },
  ];

  const totalDeliveriesRes = await Order.aggregate(
    totalDeliveriesAgr(startDate, endDate)
  );
  totalDeliveries.count = +totalDeliveriesRes?.[0]?.count?.toFixed(2) ?? 0;

  const previousTotalDeliveriesRes = await Order.aggregate(
    totalDeliveriesAgr(previousStartDate, previousEndDate)
  );
  let prevTotalDeliveries = previousTotalDeliveriesRes?.[0]?.count ?? 0;

  const deliveriesPercentChange = getPercentChange(
    totalDeliveries.count,
    prevTotalDeliveries
  );

  totalDeliveries.change = Number.isFinite(deliveriesPercentChange)
    ? deliveriesPercentChange
    : 0;

  //calculation for totalTransaction //Count of orders
  const { prevOrderCount, ...totalTransaction } = await getTotalOrders({
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    licenseKey,
  });

  // Calculation for totalRevenue //Sum of TotalAmount of all orders
  const totalRevenue = await getTotalAmountRevenue({
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    licenseKey,
  });

  // Calculation for AverageOrders //Total Orders / Total Contacts *100 (within a specific timeframe)

  const averageOrders = {
    count: 0,
    change: 0,
  };

  let totalContactsAgr = (localStartDate: string, localEndDate: string) => [
    {
      $match: {
        licenseKey: licenseKey,
        CreatedDate: {
          $gte: new Date(localStartDate),
          $lte: new Date(localEndDate),
        },
      },
    },
    {
      $count: "count",
    },
  ];

  const contactsCountRes = await Contact.aggregate(
    totalContactsAgr(localStartDate, localEndDate)
  );
  const totalContactsCount = +contactsCountRes?.[0]?.count?.toFixed(2) ?? 0;
  const previousContactsCountRes = await Contact.aggregate(
    totalContactsAgr(previousLocalStartDate, previousLocalEndDate)
  );
  let prevContactsCount = previousContactsCountRes?.[0]?.count ?? 0;

  let totalOrdersAgr = (startDate: string, endDate: string) => [
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
      $count: "count",
    },
  ];

  const orderCountRes = await Order.aggregate(
    totalOrdersAgr(startDate, endDate)
  );
  let totalOrdersCount = +orderCountRes?.[0]?.count?.toFixed(2) ?? 0;

  const previousOrderCountRes = await Order.aggregate(
    totalOrdersAgr(previousStartDate, previousEndDate)
  );
  let prevTotalOrderCount = previousOrderCountRes?.[0]?.count ?? 0;

  let calcAverageOrders = +(totalOrdersCount / totalContactsCount).toFixed(2);
  averageOrders.count = Number.isFinite(calcAverageOrders)
    ? calcAverageOrders
    : 0;

  let prevCalcAverageOrders = prevTotalOrderCount / prevContactsCount;
  prevCalcAverageOrders = Number.isFinite(prevCalcAverageOrders)
    ? prevCalcAverageOrders
    : 0;

  averageOrders.change = getPercentChange(
    averageOrders.count,
    prevCalcAverageOrders
  );

  return {
    totalDeliveries,
    totalTransaction,
    totalRevenue,
    averageOrders,
  };
};

export const getTopSoldProducts = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ?: string;
}) => {
  await connectDB();

  const topSoldProducts = await OrderItem.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        "Order.EffectiveDate": {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          Name: "$Product2.Name",
          date: {
            $dateToString: {
              format: "%d %m %Y",
              date: "$Order.EffectiveDate",
              timezone: clientTZ,
            },
          },
        },
        TotalPrice: {
          $sum: "$TotalPrice",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $group: {
        _id: "$_id.Name",
        dailyRevenue: {
          $push: {
            date: "$_id.date",
            revenue: "$TotalPrice",
          },
        },
        totalPrice: {
          $sum: "$TotalPrice",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        totalPrice: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        Name: "$_id",
        dailyRevenue: 1,
        _id: 0,
        CurrencyIsoCode: 1,
      },
    },
  ]);

  let result = topSoldProducts?.map((e) => {
    e.dailyRevenue.forEach((item: any) => {
      item.date = moment(item.date, "DD MM YYYY");
      item.revenue = +item.revenue.toFixed(2);
    });
    e.dailyRevenue.sort((a: any, b: any) => a.date - b.date);
    e.dailyRevenue.forEach((item: any) => {
      item.date = moment(item.date).format("DD MMM YYYY");
    });

    return e;
  });

  return result;
};

export const getTopSourceAndMediumByRevenue = async ({
  licenseKey,
  sourcesCount = 5,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
}: {
  licenseKey: string;
  sourcesCount: number;
  startDate?: string;
  endDate?: string;
  clientTZ?: string;
}) => {
  await connectDB();

  const topAccountSourceRevenue = await Order.aggregate([
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
        _id: "$Account.AccountSource",
        revenue: {
          $sum: "$TotalAmount",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
    { $limit: 5 },
  ]);

  let result = topAccountSourceRevenue?.map((el) => ({
    ...el,
    name: el._id == null ? "Direct Walkins" : el._id,
    revenue: +el.revenue.toFixed(2),
  }));

  return result;
};

export const getTopCitiesByRevenue = async ({
  licenseKey,
  limit,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
}: {
  licenseKey: string;
  limit: number;
  startDate: string;
  endDate: string;
  clientTZ?: string;
}) => {
  await connectDB();

  const topCitiesRevenue = await Order.aggregate([
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
        _id: { $toLower: "$BillingCity" },
        revenue: {
          $sum: "$TotalAmount",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
    { $limit: limit },
  ]);

  let result = topCitiesRevenue?.map((el) => ({
    ...el,
    name: el._id,
    revenue: +el.revenue.toFixed(2),
  }));

  return result;
};
