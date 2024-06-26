import {
  eDataExtensionKey,
  eDataExtensionParams,
  getPercentChange,
  getPreviousRange,
} from "@/lib/Constants";
import connectDB, { dataExtensionCountsKeyMap } from "@/lib/helpers/DBHelpers";
import {
  defaultDateRange,
  getLocalDateFromUTCDateTime,
} from "@/lib/helpers/DateHelpers";
import { Bounces } from "src/app/Model/bounces";
import { Clicks } from "src/app/Model/clicks";
import { Sents } from "src/app/Model/sents";
import { Model } from "mongoose";
import { getTopCampaignTablesData } from "../common/common-controllers";
import { Opens } from "@/model/opens";
import { defaultSystemTZ } from "@/lib/utils/common";

export const getEngagementCounts = async ({
  licenseKey,
  dataExtensionKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
  sfmcTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  dataExtensionKey: eDataExtensionKey;
  clientTZ?: string;
  sfmcTimezone: string;
}) => {
  const tz = sfmcTimezone;

  let localStartDate = getLocalDateFromUTCDateTime(startDate, tz).toISOString();
  let localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();

  const dateFieldKey: string = "date";
  const {
    previousStartDate: previousLocalStartDate,
    previousEndDate: previousLocalEndDate,
  } = getPreviousRange(localStartDate, localEndDate);

  await connectDB();

  switch (dataExtensionKey) {
    case eDataExtensionKey.CTR:
      return getCtrCounts(
        licenseKey,
        {
          startDate: localStartDate,
          endDate: localEndDate,
          previousStartDate: previousLocalStartDate,
          previousEndDate: previousLocalEndDate,
        },
        dateFieldKey
      );
    case eDataExtensionKey.DELIVERIES:
      return getDeliveriesCounts(
        licenseKey,
        {
          startDate: localStartDate,
          endDate: localEndDate,
          previousStartDate: previousLocalStartDate,
          previousEndDate: previousLocalEndDate,
        },
        dateFieldKey
      );
    default:
      const extensionData = dataExtensionCountsKeyMap.find(
        (extMap) => extMap.extensionKey === dataExtensionKey
      );
      const dbModel = extensionData ? extensionData.dbModel : undefined;
      return await getCommonDataExtensionCounts(
        licenseKey,
        {
          startDate: localStartDate,
          endDate: localEndDate,
          previousStartDate: previousLocalStartDate,
          previousEndDate: previousLocalEndDate,
        },
        dateFieldKey,
        dataExtensionKey,
        dbModel
      );
  }
};

const getCtrCounts = async (
  licenseKey: string,
  {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
  }: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  },
  dateFieldKey: string
) => {
  const response: {
    count: number;
    change: number;
  } = {
    count: 0,
    change: 0,
  };
  const getCtrCount = async (startDate: any, endDate: any) => {
    const getCountsFromModel = async (
      dbModel: Model<any>,
      sumField: "sents" | "clicks"
    ) => {
      return (
        (
          await dbModel.aggregate([
            {
              $match: {
                [`values.${dateFieldKey}`]: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
                },
                licenseKey: licenseKey,
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: { $toInt: `$values.${sumField}` } },
              },
            },
          ])
        )?.[0]?.total ?? 0
      );
    };

    const clicksCount = await getCountsFromModel(Clicks, "clicks");
    const sentsCount = await getCountsFromModel(Sents, "sents");
    let ctrCount = +((clicksCount / sentsCount) * 100).toFixed(2);
    return Number.isFinite(ctrCount) ? ctrCount : 0;
  };
  const ctrCount = await getCtrCount(startDate, endDate);
  const prevCtrCount = await getCtrCount(previousStartDate, previousEndDate);
  const precentChange = getPercentChange(ctrCount, prevCtrCount);
  response.count = Number.isFinite(ctrCount) ? ctrCount : 0;
  response.change = Number.isFinite(precentChange) ? precentChange : 0;
  return response;
};

const getDeliveriesCounts = async (
  licenseKey: string,
  {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
  }: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  },
  dateFieldKey: string
) => {
  const response: {
    count: number;
    change: number;
  } = {
    count: 0,
    change: 0,
  };
  const getDeliveriesCount = async (startDate: any, endDate: any) => {
    const bouncesCount = await Bounces.countDocuments({
      [`values.${dateFieldKey}`]: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      licenseKey: licenseKey,
    });

    const sentsCount = await Sents.aggregate([
      {
        $match: {
          [`values.${dateFieldKey}`]: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
          licenseKey: licenseKey,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toInt: `$values.sents` } },
        },
      },
    ]);
    let deliveriesCount = +((sentsCount?.[0]?.total ?? 0) - bouncesCount);
    return deliveriesCount;
  };

  const selectedDeliveriesCount = await getDeliveriesCount(startDate, endDate);

  const prevDeliveriesCount = await getDeliveriesCount(
    previousStartDate,
    previousEndDate
  );

  const precentChange = getPercentChange(
    selectedDeliveriesCount,
    prevDeliveriesCount
  );
  response.count = Number.isFinite(selectedDeliveriesCount)
    ? selectedDeliveriesCount
    : 0;
  response.change = Number.isFinite(precentChange) ? precentChange : 0;
  return response;
};

const getCommonDataExtensionCounts = async (
  licenseKey: string,
  {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
  }: {
    startDate: string;
    endDate: string;
    previousStartDate: string;
    previousEndDate: string;
  },
  dateFieldKey: string,
  dataExtensionKey: eDataExtensionKey,
  dbModel?: Model<any>
) => {
  const response: {
    count: number;
    change: number;
  } = {
    count: 0,
    change: 0,
  };

  const findCountFromDB = async (startDate: any, endDate: any) => {
    //helpers
    const uniqueCountsExtensions = [
      eDataExtensionKey.UNIQUE_CLICKS,
      eDataExtensionKey.UNIQUE_OPENS,
    ];
    const onlyCountsExtensions = [
      eDataExtensionKey.BOUNCES,
      eDataExtensionKey.UNSUBSCRIBERS,
    ];
    const getSumField = () =>
      dataExtensionKey.toLowerCase().includes(eDataExtensionKey.OPENS)
        ? eDataExtensionKey.OPENS
        : eDataExtensionKey.CLICKS;

    //default basic aggr match condition for all extensions
    let matchCondition: any = {
      licenseKey: licenseKey,
      "values.date": {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    // default finalStage for aggr where sum of particular field (example 'clicks' or 'opens') is required
    // (i.e.in case of opens,clicks,uniqueOpens,uniqueClicks)
    let finalStage: any = {
      $group: {
        _id: null,
        total: { $sum: { $toInt: `$values.${getSumField()}` } },
      },
    };
    //match condition for extensions where docs with isunique True is required (i.e. in case of uniqueOpens and uniqueClicks)
    if (uniqueCountsExtensions.includes(dataExtensionKey)) {
      matchCondition = {
        ...matchCondition,
        "values.isunique": "True",
      };
    }

    //final stage for extensions where only count of docs is required(i.e in case of bounces and unsunscribers)
    if (onlyCountsExtensions.includes(dataExtensionKey)) {
      finalStage = {
        $count: "total",
      };
    }

    const aggregationPipeline: any = [{ $match: matchCondition }, finalStage];

    return (await dbModel!.aggregate(aggregationPipeline))?.[0]?.total ?? 0;
  };
  const selectedRangeDataExtCount = await findCountFromDB(startDate, endDate);
  const prevRangeDataExtCount = await findCountFromDB(
    previousStartDate,
    previousEndDate
  );
  const precentChange = getPercentChange(
    selectedRangeDataExtCount,
    prevRangeDataExtCount
  );
  response.count = selectedRangeDataExtCount;
  response.change = Number.isFinite(precentChange) ? precentChange : 0;
  return response;
};

export const getCampaignClicks = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  getOnlyUnique = false,
  sfmcTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  getOnlyUnique: boolean;
  sfmcTimezone: string;
}) => {
  await connectDB();
  const tz = sfmcTimezone;
  let localStartDate = getLocalDateFromUTCDateTime(startDate, tz).toISOString();
  let localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();

  let matchCondition: any = {
    licenseKey: licenseKey,
    "values.date": {
      $gte: new Date(localStartDate),
      $lte: new Date(localEndDate),
    },
  };

  if (getOnlyUnique) matchCondition["values.isunique"] = "True";

  const topCampaignClicks = await Clicks.aggregate([
    {
      $match: matchCondition,
    },
    {
      $group: {
        _id: "$values.campaign",
        clicks: { $sum: { $toInt: "$values.clicks" } },
      },
    },
    {
      $sort: { clicks: -1 },
    },
    {
      $limit: 5,
    },
  ]);

  let campaignClick = topCampaignClicks
    .sort((a: any, b: any) => topCampaignClicks[b] - topCampaignClicks[a])
    .map(({ _id, clicks }) => ({ name: _id, clicks }));

  return campaignClick;
};

export const getCampaignSents = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
  sfmcTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ?: string;
  sfmcTimezone: string;
}) => {
  const tz = sfmcTimezone;
  let localStartDate = getLocalDateFromUTCDateTime(startDate, tz).toISOString();
  let localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();

  return await getTopCampaignTablesData({
    licenseKey,
    startDate: localStartDate,
    endDate: localEndDate,
    clientTZ,
    dataExtensionParam: eDataExtensionParams.SENTS,
  });
};

export const getCampaignOpens = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
  sfmcTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ?: string;
  sfmcTimezone: string;
}) => {
  const tz = sfmcTimezone;
  let localStartDate = getLocalDateFromUTCDateTime(startDate, tz).toISOString();
  let localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();

  return await getTopCampaignTablesData({
    licenseKey,
    startDate: localStartDate,
    endDate: localEndDate,
    clientTZ,
    dataExtensionParam: eDataExtensionParams.OPENS,
  });
};

export const getCampaignDayWiseUniqueOpens = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
  sfmcTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ?: string;
  sfmcTimezone: string;
}) => {
  await connectDB();

  const tz = sfmcTimezone;
  let localStartDate = getLocalDateFromUTCDateTime(startDate, tz).toISOString();
  let localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();

  const uniqueOpenByWeekdays = await Opens.aggregate([
    {
      $match: {
        licenseKey: licenseKey,
        "values.isunique": "True",
        "values.date": {
          $gte: new Date(localStartDate),
          $lte: new Date(localEndDate),
        },
      },
    },
    {
      $group: {
        _id: "$values.weekdays",
        unique: { $sum: { $toInt: "$values.opens" } },
      },
    },
    {
      $sort: { _id: -1 },
    },
    {
      $limit: 7,
    },
  ]);

  let uniqueOpens = uniqueOpenByWeekdays.map(({ _id, unique }) => ({
    weekday: _id,
    unique,
  }));

  return uniqueOpens;
};

export const getCampaignClicksSentsOpens = async ({
  licenseKey,
  startDate = defaultDateRange.startDate,
  endDate = defaultDateRange.endDate,
  clientTZ = defaultSystemTZ,
  sfmcTimezone,
}: {
  licenseKey: string;
  startDate: string;
  endDate: string;
  clientTZ?: string;
  sfmcTimezone: string;
}) => {
  await connectDB();

  const tz = sfmcTimezone;
  let localStartDate = getLocalDateFromUTCDateTime(startDate, tz).toISOString();
  let localEndDate = getLocalDateFromUTCDateTime(endDate, tz).toISOString();
  const campaignClicksSentsOpensRes = await Clicks.aggregate([
    {
      $unionWith: {
        coll: "opens",
      },
    },
    {
      $unionWith: {
        coll: "sents",
      },
    },
    {
      $match: {
        licenseKey: licenseKey,
        "values.date": {
          $gte: new Date(localStartDate),
          $lte: new Date(localEndDate),
        },
      },
    },
    {
      $group: {
        _id: "$values.campaign",
        clicks: {
          $sum: {
            $toInt: "$values.clicks",
          },
        },
        opens: {
          $sum: {
            $toInt: "$values.opens",
          },
        },
        sents: {
          $sum: {
            $toInt: "$values.sents",
          },
        },
      },
    },
    {
      $sort: {
        sents: -1,
      },
    },
    { $limit: 5 },
  ]);

  let results = campaignClicksSentsOpensRes.map((el) => {
    return {
      ...el,
      name: el._id,
    };
  });

  return results;
};
