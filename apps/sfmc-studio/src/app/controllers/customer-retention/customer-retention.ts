import moment from "moment-timezone";
import {
  defaultDateRange,
  getLocalDateFromUTCDateTime,
} from "@/lib/helpers/DateHelpers";
import connectDB from "@/lib/helpers/DBHelpers";
import { Order } from "src/app/Model/orders";
import { OrderItem } from "src/app/Model/orderItems";
import { getTotalContacts, getTotalOrders } from "../common/common-controllers";
import { getPercentChange, getPreviousRange } from "@/lib/Constants";
import { defaultSystemTZ } from "@/lib/utils/common";

export const getRetentionCounts = async ({
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
        _id: "",
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

  //calculation for totalOrders //Count of orders
  const { prevOrderCount, ...totalOrders } = await getTotalOrders({
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    licenseKey,
  });

  //calculation for averageOrderApis // Count of totalAmount/ totalOrders
  const averageOrderValue = {
    count: 0,
    change: 0,
    currency: "",
  };

  const calcAverageOrderValue = +(
    totalAmount.count / totalOrders.count
  ).toFixed(2);
  averageOrderValue.count = Number.isFinite(calcAverageOrderValue)
    ? calcAverageOrderValue
    : 0;
  averageOrderValue.currency = totalAmount.currency;

  let calcPreviousAverageOrderValue = prevTotalAmount / prevOrderCount;
  calcPreviousAverageOrderValue = Number.isFinite(calcPreviousAverageOrderValue)
    ? calcPreviousAverageOrderValue
    : 0;

  const averageOrderValuePercentChange = getPercentChange(
    averageOrderValue.count,
    calcPreviousAverageOrderValue
  );

  averageOrderValue.change = Number.isFinite(averageOrderValuePercentChange)
    ? averageOrderValuePercentChange
    : 0;

  //NewClients // Total Contacts (within a specific timeframe)
  const newClients = await getTotalContacts({
    localStartDate,
    localEndDate,
    previousLocalStartDate,
    previousLocalEndDate,
    licenseKey,
  });

  return {
    totalAmount,
    averageOrderValue,
    totalOrders,
    newClients,
  };
};

export const getRevenueBySource = async ({
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

  const orderByAccountSourceTotalAmount = await Order.aggregate([
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
    { $limit: 4 },
  ]);

  let revenueSource = orderByAccountSourceTotalAmount?.map((el) => ({
    ...el,
    name: el._id == null ? "Direct Walkins" : el._id,
    revenue: +el.revenue.toFixed(2),
  }));

  return revenueSource;
};

export const getOrderByStatus = async ({
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

  const orderByStatus = await Order.aggregate([
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
        _id: "$Status",
        count: {
          $count: {},
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: 4,
    },
  ]);

  let ordersWithStatus = orderByStatus?.map((el) => ({
    ...el,
    status: el._id,
  }));

  return ordersWithStatus;
};

export const getTopProductsByRevenue = async ({
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

  const topProductRevenue = await OrderItem.aggregate([
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
        _id: "$Product2.Name",
        revenue: { $sum: "$TotalPrice" },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);

  let productByRevenue = topProductRevenue?.map((el) => ({
    ...el,
    productName: el._id,
    revenue: +el.revenue.toFixed(2),
  }));

  return productByRevenue;
};

export const getTopProductsSKU = async ({
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

  const topProductSku = await OrderItem.aggregate([
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
          $ifNull: ["$Product2.StockKeepingUnit", "Others"], // Replace null with "Others"
        },
        revenue: { $sum: "$TotalPrice" },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);

  let productSKU = topProductSku?.map((el) => ({
    ...el,
    productSKU: el._id,
    revenue: +el.revenue.toFixed(2),
  }));

  return productSKU;
};

export const getTopSoldProductItems = async ({
  licenseKey,
  sortBy = "soldAmount",
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
}: {
  licenseKey: string;
  sortBy?: "soldAmount" | "revenue";
  startDate: string;
  endDate: string;
  clientTZ?: string;
}) => {
  await connectDB();

  const topSoldProductItems = await OrderItem.aggregate([
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
        _id: "$Product2.Name",
        revenue: {
          $sum: "$TotalPrice",
        },
        soldAmount: {
          $sum: "$Quantity",
        },
        productUrl: {
          $first: "$Product2.DisplayUrl",
        },
        productFamily: {
          $first: "$Product2.Family",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        soldAmount: -1,
      },
    },
    {
      $limit: 10,
    },
  ]);

  let productByRevenue = topSoldProductItems?.map((el) => ({
    ...el,
    productName: el._id,
    revenue: +el.revenue.toFixed(2),
  }));

  return productByRevenue;
};

export const getTopOrdersByOrderType = async ({
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

  const ordersKeys = await Order.aggregate([
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
        _id: {
          Type: "$Type",
          date: {
            $dateToString: {
              format: "%d %m %Y",
              date: "$EffectiveDate",
              timezone: clientTZ,
            },
          },
        },
        totalAmount: {
          $sum: "$TotalAmount",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $group: {
        _id: "$_id.Type",
        dailyRevenue: {
          $push: {
            date: "$_id.date",
            revenue: "$totalAmount",
          },
        },
        totalRevenue: {
          $sum: "$totalAmount",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        totalRevenue: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        Type: "$_id",
        dailyRevenue: 1,
        _id: 0,
        CurrencyIsoCode: 1,
      },
    },
  ]);

  let result = ordersKeys?.map((e) => {
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

export const getTopSoldFamily = async ({
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

  let CreatedDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

  const topSoldProductFamily = await OrderItem.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        "Order.EffectiveDate": CreatedDate,
      },
    },
    {
      $group: {
        _id: "$Product2.Family",
        revenue: { $sum: "$TotalPrice" },
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

  let familyString = topSoldProductFamily.map((e) => e._id);

  let second = await OrderItem.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        "Order.EffectiveDate": CreatedDate,
        "Product2.Family": { $in: familyString },
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: "%d %m %Y",
              date: "$Order.EffectiveDate",
              timezone: clientTZ,
            },
          },
          family: "$Product2.Family",
        },
        revenue: {
          $sum: "$TotalPrice",
        },
        CurrencyIsoCode: { $first: "$CurrencyIsoCode" },
      },
    },
    {
      $sort: {
        "_id.date": 1,
      },
    },
    {
      $group: {
        _id: "$_id.date",
        data: {
          $push: {
            family: "$_id.family",
            revenue: "$revenue",
            CurrencyIsoCode: "$CurrencyIsoCode",
          },
        },
      },
    },
  ]);

  let result = second
    ?.map((e) => {
      e.date = moment(e._id, "DD MM YYYY");
      e.data.forEach((item: any) => {
        item.family = item.family == null ? "No Family" : item.family;
        item.revenue = +item.revenue.toFixed(2);
      });

      return e;
    })
    .sort(
      (a: any, b: any) =>
        moment(a.date, "DD MM YYYY").unix() -
        moment(b.date, "DD MM YYYY").unix()
    );

  let updatedResult = result.map((el) => ({
    ...el,
    date: moment(el._id, "DD MM YYYY").format("DD MMM YYYY"),
  }));

  return updatedResult;
};
