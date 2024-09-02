"use client";
import React, { useEffect, useState } from "react";
import CustomerAcquisitionCounts from "./CustomerAcquisitionCounts";
import TopCities from "./TopCities";
import TotalOrders from "./TotalOrders";
import TotalUsers from "./TotalUsers";
import style from "./customerAcquisition.module.scss";
import { useSDK } from "@contentful/react-apps-toolkit";
import { PageAppSDK } from "@contentful/app-sdk";
import { ApiClient } from "@/lib/ApiClients";
import LastYearContact from "./LastYearContact";
import LastWeekContact from "./LastWeekContact";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { defaultSystemTZ, encryptData } from "@/lib/utils/common";
import { loadingState } from "@/redux/slices/loadersSlice";
import { barChartColor, barLabelColor } from "@/lib/utils/getColor";
import { dateStartEnd } from "@/redux/slices/dateSlice";
import { ContactCounts, TopCitiesType, TopOrders } from "@/lib/types/dashboard";
import { commonChartConfig } from "@/lib/utils/dashboards";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import advancedFormat from "dayjs/plugin/advancedFormat";

// Extend dayjs with the utc plugin
dayjs.extend(utc);
dayjs.extend(advancedFormat);

function CustomerAcquisition({ order }: { order: number }) {
  const { parameters } = useSDK<PageAppSDK>();
  const client = ApiClient();
  const {
    dateSlice,
    navigationSlice,
    loaderSlice,
    themeSlice,
    authSlice: { isAuth },
  } = useAppSelector((state) => state);
  const dispatch = useAppDispatch();
  const [counts, setCounts] = useState<ContactCounts>({
    totalContacts: 0,
    newContacts: 0,
  });
  const [lastWeekContact, setLastWeekContact] = useState<any>([]);
  const [lastYearContact, setLastYearContact] = useState<any>([]);
  const [topCities, setTopCities] = useState<TopCitiesType[]>([]);
  const [topOrders, setTopOrders] = useState<TopOrders[]>([]);
  const [totalUsers, setTotalUsers] = useState<TotalUsers[]>([]);

  useEffect(() => {
    fetchData(dateSlice?.dateRange);
  }, [dateSlice?.dateRange, isAuth]);

  const fetchData = async (dateRange: dateStartEnd) => {
    if (parameters?.installation?.licenseKey && isAuth) {
      try {
        dispatch(loadingState(true));
        const [
          contactCountsResponse,
          newContactsResponse,
          topCitiesRes,
          topOrdersRes,
          totalUsersRes,
        ] = await Promise.all([
          fetchContactCounts(),
          fetchNewContacts(),
          fetchTopCitiesOrder(dateRange),
          fetchTopOrdersTop(dateRange),
          fetchTotalUsers(dateRange),
        ]);

        setCounts({
          totalContacts: contactCountsResponse?.data?.data?.totalContacts,
          newContacts: contactCountsResponse?.data?.data?.newContacts,
        });

        setLastWeekContact(newContactsResponse?.data?.data?.lastWeekCounts);
        setLastYearContact(newContactsResponse?.data?.data?.lastYearCounts);

        setTopCities(
          topCitiesRes?.data?.data?.map((elm: TopCitiesType, i: number) => {
            return {
              ...elm,
              color: barChartColor[i],
              labelColor: barLabelColor[i],
              name: commonChartConfig.capitalizeLabel(elm, "name"),
            };
          })
        );
        setTopOrders(topOrdersRes?.data?.data);
        setTotalUsers(totalUsersRes?.data?.data);
      } catch (e) {
        console.log("Error occurred during data fetching:", e);
      } finally {
        if (navigationSlice.activeRoute.order === order)
          dispatch(loadingState(false));
      }
    }
  };

  const fetchContactCounts = async () => {
    try {
      const res = await client.post(
        "/api/dashboard/customer-acquisition",
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          sfscTimezone: parameters.installation.sfscTimezone,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
            ["jro34134ecr4aex"]: `${encryptData({
              validate: Date.now(),
              token: process.env.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        }
      );

      if (res.status !== 200)
        console.log("Error occured fetching contact counts");

      return res;
    } catch (err) {
      console.log("Error occured fetching contact counts");
    }
  };

  const fetchNewContacts = async () => {
    let date = {
      weekStartDate: dayjs
        .utc()
        .subtract(6, "days")
        .startOf("day")
        .toISOString(),
      weekEndDate: dayjs.utc().endOf("day").toISOString(),
      monthStartDate: dayjs
        .utc()
        .subtract(6, "months")
        .startOf("day")
        .toISOString(),
      monthEndDate: dayjs.utc().endOf("day").toISOString(),
    };
    try {
      const res = await client.post(
        "/api/dashboard/customer-acquisition/new-contacts",
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          sfscTimezone: parameters.installation.sfscTimezone,
          date,
          clientTZ: defaultSystemTZ,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
            ["jro34134ecr4aex"]: `${encryptData({
              validate: Date.now(),
              token: process.env.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        }
      );
      if (res.status !== 200)
        console.log("Error occured fetching contact counts");

      return res;
    } catch (err) {
      console.log("Error occured fetching contact counts");
    }
  };

  const fetchTopCitiesOrder = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        "/api/dashboard/customer-acquisition/top-cities",
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          ...dateRange,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
            ["jro34134ecr4aex"]: `${encryptData({
              validate: Date.now(),
              token: process.env.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        }
      );

      if (res.status !== 200)
        console.log("Error occured fetching top-cities data");

      return res;
    } catch (err) {
      console.log("Error occured fetching top revenue");
    }
  };

  const fetchTopOrdersTop = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        "/api/dashboard/customer-acquisition/total-orders",
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          ...dateRange,
          clientTZ: defaultSystemTZ,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
            ["jro34134ecr4aex"]: `${encryptData({
              validate: Date.now(),
              token: process.env.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        }
      );
      if (res.status !== 200)
        console.log("Error occured fetching conversion data");

      return res;
    } catch (err) {
      console.log("Error occured fetching top revenue");
    }
  };

  const fetchTotalUsers = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        "/api/dashboard/customer-acquisition/total-users",
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          sfscTimezone: parameters.installation.sfscTimezone,
          ...dateRange,
          clientTZ: defaultSystemTZ,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
            ["jro34134ecr4aex"]: `${encryptData({
              validate: Date.now(),
              token: process.env.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        }
      );
      if (res.status !== 200)
        console.log("Error occured fetching conversion data");

      return res;
    } catch (err) {
      console.log("Error occured fetching top revenue");
    }
  };

  return (
    <>
      <CustomerAcquisitionCounts contactCounts={counts} />
      <div
        className={`${style.CountsMainContain} ${
          themeSlice.theme == "dark" ? style.DarkTheme : ""
        }`}
      >
        <div
          className={`${style.CountsMainContainInnerCont} ${themeSlice.theme}`}
        >
          <LastWeekContact lastWeekContact={lastWeekContact} />
        </div>
        <div
          className={`${style.CountsMainContainInnerCont} ${themeSlice.theme}`}
        >
          <LastYearContact lastYearContact={lastYearContact} />
        </div>
      </div>
      <div
        className={`${style.DeviceCityMainContain} ${
          themeSlice.theme == "dark" ? style.DarkTheme : ""
        }`}
      >
        <div className={`${style.DeviceCategoryData} ${themeSlice.theme}`}>
          <TopCities topCities={topCities} />
        </div>
        <div className={`${style.TopCitiesData} ${themeSlice.theme}`}>
          <TotalOrders topOrders={topOrders} />
        </div>
      </div>
      <TotalUsers totalUsers={totalUsers} />
    </>
  );
}

export default CustomerAcquisition;
