import connectDB from "@/lib/helpers/DBHelpers";
import {
  DefaultSyncDates,
  getLocalDateFromUTCDateTime,
  defaultDateRange,
  getMoment,
} from "@/lib/helpers/DateHelpers";
import { Contact } from "@/model/contacts";
import moment from "moment-timezone";
import { Order } from "src/app/Model/orders";
import { defaultSystemTZ } from "@/lib/utils/common";

// Total Contacts and New Contacts Count
const getAcquisitionCounts = async ({
  licenseKey,
  sfscTimezone,
}: {
  licenseKey: string;
  sfscTimezone: string;
}) => {
  const response: {
    totalContacts: number;
    newContacts: number;
  } = {
    totalContacts: 0,
    newContacts: 0,
  };

  await connectDB();
  const tz = sfscTimezone;
  const subscriberTotalCount = await Contact.countDocuments({
    licenseKey: licenseKey,
    CreatedDate: {
      $gte: new Date(
        getMoment(undefined, tz)
          .subtract(6, "months")
          .startOf("day")
          .toISOString()
      ),
      $lte: new Date(
        DefaultSyncDates.salesCloud("contacts", tz).syncEndDate.toISOString()
      ),
    },
  });

  //total contacts count
  response.totalContacts = subscriberTotalCount;
  const subscriberNewContacts = await Contact.countDocuments({
    licenseKey: licenseKey,
    CreatedDate: {
      $gte: new Date(getMoment(undefined, tz).startOf("day").toISOString()),
      $lte: new Date(getMoment(undefined, tz).endOf("day").toISOString()),
    },
  });

  //new contacts count
  response.newContacts = subscriberNewContacts;

  return response;
};

const getAcquisitionNewContacts = async ({
  licenseKey,
  clientTZ = defaultSystemTZ,
  date: { weekStartDate, weekEndDate, monthStartDate, monthEndDate },
  sfscTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ: string;
  date: {
    weekStartDate: string;
    weekEndDate: string;
    monthStartDate: string;
    monthEndDate: string;
  };
  sfscTimezone: string;
}) => {
  const response: {
    lastWeekCounts: { date: string; day: string; count: number }[];
    lastYearCounts: { month: string; count: number }[];
  } = {
    lastWeekCounts: [],
    lastYearCounts: [],
  };

  await connectDB();

  const tz = sfscTimezone;
  const localWeekStartDate = getMoment(undefined, tz)
    .subtract(6, "days")
    .startOf("day")
    .toISOString();
  const localWeekEndDate = getMoment(undefined, tz).endOf("day").toISOString();
  const localMonthStartDate = getMoment(undefined, tz)
    .subtract(6, "months")
    .startOf("day")
    .toISOString();
  const localMonthEndDate = getMoment(undefined, tz).endOf("day").toISOString();

  // week data
  const lastWeekData = await Contact.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        CreatedDate: {
          $gte: new Date(localWeekStartDate),
          $lte: new Date(localWeekEndDate),
        },
      },
    },
    {
      $addFields: {
        ConvertedDate: {
          $dateFromString: {
            dateString: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S",
                date: "$CreatedDate",
                timezone: tz,
              },
            },
            timezone: "UTC",
          },
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$ConvertedDate",
            // timezone: clientTZ,
          },
        },
        count: { $count: {} },
      },
    },
  ]);

  const updateWeekData = lastWeekData
    .map((el) => ({
      ...el,
      day: moment(el._id, "YYYY-MM-DD").format("ddd"),
      Date: moment(el._id, "YYYY-MMM-DD").toDate(),
    }))
    .sort((a, b) => moment(a._id).valueOf() - moment(b._id).valueOf());

  const results = updateWeekData.map((el) => ({
    ...el,
    Date: el._id,
  }));
  response.lastWeekCounts = results;

  // yearly data

  const count = await Contact.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        CreatedDate: {
          $gte: new Date(localMonthStartDate),
          $lte: new Date(localMonthEndDate),
        },
      },
    },
    {
      $addFields: {
        ConvertedDate: {
          $dateFromString: {
            dateString: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S",
                date: "$CreatedDate",
                timezone: tz,
              },
            },
            timezone: "UTC",
          },
        },
      },
    },
    {
      $project: {
        formattedDate: {
          $dateToString: {
            date: "$ConvertedDate",
            // timezone: clientTZ,
          },
        },
      },
    },
    {
      $group: {
        _id: {
          year: {
            $year: {
              $toDate: "$formattedDate",
            },
          },
          month: {
            $month: {
              $toDate: "$formattedDate",
            },
          },
        },
        count: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        "_id.month": -1,
        "_id.year": -1,
      },
    },
  ]);

  const countsMap = new Map();

  // Assume `result` contains the output from your MongoDB query

  const startDate = new Date(localMonthStartDate);
  const endDate = new Date(localMonthEndDate);
  // Iterate over the MongoDB result and populate the countsMap

  count.forEach((item) => {
    const { _id, count } = item;
    const year = _id.year;
    const month = _id.month;
    countsMap.set(`${year}-${month}`, count);
  });

  // Create an array to store the final result
  const finalResult = [];
  // Iterate over the months within the start and end date range and populate the final result

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();

    const month = currentDate.getMonth() + 1; // Month is 1-indexed

    const count = countsMap.get(`${year}-${month}`) || 0;

    finalResult.push({
      _id: {
        year: year,

        month: month,
      },

      count: count,
    });

    currentDate.setMonth(currentDate.getMonth() + 1); // Move to the next month
  }

  const formatMonthYear = (_id: { year: number; month: number }) => {
    return moment({ year: _id.year, month: _id.month - 1 }).format("MMM YYYY");
  };

  response.lastYearCounts = finalResult.map((el) => ({
    ...el,
    month: formatMonthYear(el._id),
  }));

  return response;
};

// Graph Data Revenue By Created Date
const getTotalOrdersByDate = async ({
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

  const totalOrderByDate = await Order.aggregate([
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
      $project: {
        convertedDate: {
          $dateToString: {
            format: "%d %m %Y",
            date: "$EffectiveDate",
            timezone: clientTZ,
          },
        },
      },
    },
    {
      $sort: {
        convertedDate: 1,
      },
    },
    {
      $group: {
        _id: "$convertedDate",
        count: {
          $count: {},
        },
      },
    },
  ]);

  let results = totalOrderByDate
    ?.map((e) => ({
      ...e,
      Date: moment(e._id, "DD MM YYYY").toDate(), // Convert to JavaScript Date object
      count: +e.count.toFixed(2),
    }))
    .sort((a, b) => moment(a.Date).valueOf() - moment(b.Date).valueOf());
  let updatedResult = results.map((el) => ({
    ...el,
    Date: moment(el.Date).format("DD MMM YYYY"),
  }));

  return updatedResult;
};

// Total Users by Date
const getTotalUsersByDate = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
  sfscTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ: string;
  sfscTimezone: string;
}) => {
  await connectDB();
  const tz = sfscTimezone;

  let localStartDate = getLocalDateFromUTCDateTime(startDate, tz).toISOString();
  let localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();

  const totalUser = await Contact.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        CreatedDate: {
          $gte: new Date(localStartDate),
          $lte: new Date(localEndDate),
        },
        HasOptedOutOfEmail: false,
      },
    },
    {
      $addFields: {
        ConvertedDate: {
          $dateFromString: {
            dateString: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M:%S",
                date: "$CreatedDate",
                timezone: tz,
              },
            },
            timezone: "UTC",
          },
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%d %m %Y",
            date: "$ConvertedDate",
            // timezone: clientTZ,
          },
        },
        count: { $count: {} },
      },
    },
  ]);

  let results = totalUser
    ?.map((e) => ({
      ...e,
      Date: moment(e._id, "DD MM YYYY").toDate(),
    }))
    .sort((a, b) => moment(a.Date).valueOf() - moment(b.Date).valueOf());

  let updatedResult = results.map((el) => ({
    ...el,
    Date: moment(el.Date).format("DD MMM YYYY"),
  }));

  return updatedResult;
};

//Top Cities By Order
const getTopCitiesByOrder = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ: string;
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
    { $limit: 7 },
  ]);

  let result = topCitiesRevenue?.map((el) => ({
    ...el,
    name: el._id,
    count: +el.count.toFixed(2),
  }));

  return result;
};

export {
  getAcquisitionCounts,
  getAcquisitionNewContacts,
  getTotalOrdersByDate,
  getTotalUsersByDate,
  getTopCitiesByOrder,
};
