"use client";
import React, { useEffect, useState } from "react";
import CustomerEngagementCounts from "./CustomerEngagementCounts";
import style from "./customerEngagement.module.scss";
import ByDayWeek from "./ByDayWeek";
import CampaignClicksEngagement from "./CampaignClicksEngagement";
import { ApiClient } from "@/lib/ApiClients";
import { useAppDispatch, useAppSelector } from "src/app/redux/hooks";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { dateStartEnd } from "src/app/redux/slices/dateSlice";
import { loadingState } from "src/app/redux/slices/loadersSlice";
import {
  ByDayWeekType,
  CampaignClicksSentsOpensType,
  CampaignClicksUniqueType,
  CountDataType,
} from "@/lib/types/dashboard";
import { Weekdays, eDataExtensionKey } from "@/lib/Constants";
import { formatInput } from "@/lib/utils/common";
import { barChartColor, barLabelColor } from "@/lib/utils/getColor";
import CampaignClicksSentsOpens from "./CampaignClicksSentsOpens";
import svgIcons from "@/lib/utils/icons";

function CustomerEngagement({ order }: { order: number }) {
  const { parameters } = useSDK<PageAppSDK>();
  const client = ApiClient();
  const dispatch = useAppDispatch();
  const {
    dateSlice,
    navigationSlice,
    authSlice: { isAuth },
  } = useAppSelector((state) => state);

  let { CustomerEngagementIcon } = svgIcons;

  //
  const [firstRowCountData, setFirstRowCountData] = useState<CountDataType[]>([
    {
      count: { count: 0, change: 0 },
      cardText: "Total Deliveries",
      icon: CustomerEngagementIcon?.totalDeliveries,
      toolTipText: "Emails successfully delivered to selected users.",
    },
    {
      count: { count: 0, change: 0 },
      cardText: "Opens",
      icon: CustomerEngagementIcon?.opens,
      toolTipText:
        "Total email opens, including multiple opens by the same recipient.",
    },
    {
      count: { count: 0, change: 0 },
      cardText: "Clicks",
      icon: CustomerEngagementIcon?.clicks,
      toolTipText: "Total number of links clicked within the delivered email.",
    },
    {
      count: { count: 0, change: 0 },
      cardText: "CTR",
      icon: CustomerEngagementIcon?.ctr,
      toolTipText:
        "Percentage of recipients who clicked on links in the email.",
    },
  ]);
  const [secondRowCountData, setSecondRowCountData] = useState<CountDataType[]>(
    [
      {
        count: { count: 0, change: 0 },
        cardText: "Unique Clicks",
        icon: CustomerEngagementIcon?.uniqueClicks,
        toolTipText: "Unique recipients who clicked links within the email.",
      },
      {
        count: { count: 0, change: 0 },
        cardText: "Unique Opens",
        icon: CustomerEngagementIcon?.uniqueOpens,
        toolTipText: "Unique recipients who opened the email.",
      },
      {
        count: { count: 0, change: 0 },
        cardText: "Bounce",
        icon: CustomerEngagementIcon?.bounce,
        toolTipText: "Undelivered emails.",
      },
      {
        count: { count: 0, change: 0 },
        cardText: "Unsubscribe",
        icon: CustomerEngagementIcon?.unsubscribe,
        toolTipText: "Recipients who opted out from the email list.",
      },
    ]
  );

  const [dayWeekUniqueOpen, setDayWeekUniqueOpen] = useState<ByDayWeekType[]>(
    []
  );

  const [campaignClickUnique, setCampaignClickUnique] = useState<
    CampaignClicksUniqueType[]
  >([]);

  const [campaignClicksSentsOpens, setCampaignClicksSentsOpens] = useState<
    CampaignClicksSentsOpensType[]
  >([]);

  useEffect(() => {
    fetchData(dateSlice.dateRange);
  }, [dateSlice.dateRange, isAuth]);

  const fetchData = async (dateRange: dateStartEnd) => {
    if (parameters?.installation?.licenseKey && isAuth) {
      try {
        dispatch(loadingState(true));
        const [
          totalDeliveries,
          opens,
          clicks,
          sents,
          uniqueClicks,
          uniqueOpens,
          bounce,
          unsubscribe,
          weeklyRes,
          campaignClicksUniqueRes,
          campaignClicksSentsOpensRes,
        ] = await Promise.all([
          fetchCount(eDataExtensionKey.DELIVERIES, dateRange),
          fetchCount(eDataExtensionKey.OPENS, dateRange),
          fetchCount(eDataExtensionKey.CLICKS, dateRange),
          fetchCount("ctr", dateRange),
          fetchCount(eDataExtensionKey.UNIQUE_CLICKS, dateRange),
          fetchCount(eDataExtensionKey.UNIQUE_OPENS, dateRange),
          fetchCount(eDataExtensionKey.BOUNCES, dateRange),
          fetchCount(eDataExtensionKey.UNSUBSCRIBERS, dateRange),
          fetchWeekUniqueOpen(dateRange),
          fetchCampaignClicksUnique(dateRange),
          fetchCampaignClicksSentsOpens(dateRange),
        ]);

        setFirstRowCountData([
          { ...firstRowCountData[0], count: totalDeliveries },
          { ...firstRowCountData[1], count: opens },
          { ...firstRowCountData[2], count: clicks },
          { ...firstRowCountData[3], count: sents },
        ]);

        setSecondRowCountData([
          { ...secondRowCountData[0], count: uniqueClicks },
          { ...secondRowCountData[1], count: uniqueOpens },
          { ...secondRowCountData[2], count: bounce },
          { ...secondRowCountData[3], count: unsubscribe },
        ]);

        setDayWeekUniqueOpen(weeklyRes);
        setCampaignClickUnique(
          campaignClicksUniqueRes?.data?.data?.map(
            (elm: CampaignClicksUniqueType, i: number) => {
              return {
                ...elm,
                displayClicks: formatInput(elm?.clicks),
                color: barChartColor[i],
                labelColor: barLabelColor[i],
              };
            }
          )
        );
        setCampaignClicksSentsOpens(campaignClicksSentsOpensRes);
      } catch (e) {
        console.log("Error occurred during data fetching:", e);
      } finally {
        if (navigationSlice.activeRoute.order === order)
          dispatch(loadingState(false));
      }
    }
  };

  const fetchCount = async (
    fileKey: string,
    date: { startDate: Date; endDate: Date }
  ) => {
    try {
      const res = await client.post("api/dashboard/customer-engagement", {
        licenseKey: parameters.installation.licenseKey,
        sfmcTimezone: parameters.installation.sfmcTimezone,
        ...date,
        dataExtensionKey: fileKey,
      });

      if (res.status !== 200)
        console.log("Error occured fetching conversion data");

      return res?.data?.data;
    } catch (err) {
      console.log("Error occured fetching top revenue");
    }
  };

  const fetchWeekUniqueOpen = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        "api/dashboard/customer-engagement/campaign-daywise-uniqueopens",
        {
          licenseKey: parameters.installation.licenseKey,
          sfmcTimezone: parameters.installation.sfmcTimezone,
          ...dateRange,
        }
      );

      if (res.status !== 200)
        console.log("Error occured fetching campaign data");

      let updatedResWeekDay: any = [];
      Object.keys(Weekdays).forEach((day) => {
        const dayAbbreviation = day as keyof typeof Weekdays;
        const existingData = res?.data?.data?.find(
          (item: ByDayWeekType) => item.weekday === dayAbbreviation
        );
        if (existingData) {
          updatedResWeekDay.push({
            ...existingData,
            weekday: Weekdays[dayAbbreviation],
            displayUniqueOpens: formatInput(existingData.unique),
          });
        }
      });

      return updatedResWeekDay;
    } catch (err) {
      console.log("Error occured fetching campaign clicks");
    }
  };

  const fetchCampaignClicksUnique = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        "api/dashboard/customer-engagement/top-campaign-clicks",
        {
          licenseKey: parameters.installation.licenseKey,
          ...dateRange,
          campaignCount: 7,
          getOnlyUnique: true,
          sfmcTimezone: parameters.installation.sfmcTimezone,
        }
      );

      if (res.status !== 200)
        console.log("Error occured fetching campaign data");

      return res;
    } catch (err) {
      console.log("Error occured fetching campaign clicks");
    }
  };

  const fetchCampaignClicksSentsOpens = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        "api/dashboard/customer-engagement/top-campaign-clicks-sents-opens",
        {
          licenseKey: parameters.installation.licenseKey,
          sfmcTimezone: parameters.installation.sfmcTimezone,
          ...dateRange,
        }
      );

      if (res.status !== 200)
        console.log("Error occured fetching campaign data");

      const data = res?.data?.data?.map(
        (item: CampaignClicksSentsOpensType) => ({
          ...item,
          displayClicks: formatInput(item.clicks),
          displayOpens: formatInput(item.opens),
          displaySents: formatInput(item.sents),
        })
      );

      return data;
    } catch (err) {
      console.log("Error occured fetching campaign clicks");
    }
  };

  return (
    <>
      <div className={style.CustomerEngagementCountRow}>
        <CustomerEngagementCounts
          firstRowCountData={firstRowCountData}
          secondRowCountData={secondRowCountData}
        />
      </div>
      <div className={style.CustomerEngagementMAinRow}>
        <CampaignClicksSentsOpens
          campaignClicksSentsOpens={campaignClicksSentsOpens}
        />
      </div>
      <div
        className={`${style.CustomerEngagementSevenThree} ${style.CustomerEngagementBottomRow}`}
      >
        <div className={style.CustomerEngagementBottomCol}>
          <ByDayWeek dayWeekUniqueOpen={dayWeekUniqueOpen} />
        </div>
        <div className={style.CustomerEngagementBottomCol}>
          <CampaignClicksEngagement campaignClickUnique={campaignClickUnique} />
        </div>
      </div>
    </>
  );
}

export default CustomerEngagement;
