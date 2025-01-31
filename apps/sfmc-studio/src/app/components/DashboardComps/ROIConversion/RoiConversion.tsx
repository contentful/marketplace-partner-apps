'use client';
import CountCard from '@/components/UI/CountCard';
import React, { useEffect, useState } from 'react';
import style from './roiConversion.module.scss';
import TopSoldProducts from './TopSoldProducts';
import TopSourceMediumRevenue from './TopSourceMediumRevenue';
import TopRevenueCity from './TopRevenueCity';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { ApiClient } from '@/lib/ApiClients';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { dateStartEnd } from 'src/app/redux/slices/dateSlice';
import { loadingState } from '@/redux/slices/loadersSlice';
import { commonChartConfig } from '@/lib/utils/dashboards';
import { barChartColor, barLabelColor, multiLineChart, pieChartColor } from '@/lib/utils/getColor';
import { defaultSystemTZ, encryptData } from '@/lib/utils/common';
import { formatInput } from '@/lib/utils/common';
import { RoiConversionCounts, TopRevenueCityType, TopRevenueOrderT, TopSoldProductsType, TopSourceMediumRevenueType } from '@/lib/types/dashboard';
import TopRevenueOrderType from './TopRevenueOrderType';
import svgIcons from '@/lib/utils/icons';
import getSymbolFromCurrency from 'currency-symbol-map';
import { environment } from '@/lib/Constants';

function RoiConversion({ order }: { order: number }) {
  const { parameters } = useSDK<PageAppSDK>();
  const client = ApiClient();
  const dispatch = useAppDispatch();
  let { RoiConversionIcon } = svgIcons;
  const {
    dateSlice,
    navigationSlice,
    themeSlice,
    authSlice: { isAuth },
  } = useAppSelector((state) => state);
  const [roiConversionCounts, setRoiConversionCounts] = useState<RoiConversionCounts[]>([
    {
      cardText: 'Total Deliveries',
      countData: { count: 0, change: 0 },
      icon: RoiConversionIcon?.totalDeliveries,
      toolTipText: 'Total number of orders successfully delivered.',
    },
    {
      cardText: 'Total Transactions',
      countData: { count: 0, change: 0 },
      icon: RoiConversionIcon?.totalTransaction,
      toolTipText: 'The overall count of transactions completed.',
    },
    {
      cardText: 'Total Revenue',
      countData: { count: 0, change: 0 },
      icon: RoiConversionIcon?.totalRevenue,
      toolTipText: 'The aggregate amount of income generated from all sales or transactions.',
    },
    {
      cardText: 'Average Orders Per Customer',
      countData: { count: 0, change: 0 },
      icon: RoiConversionIcon?.averageOrdersPerCustomer,
      toolTipText: 'The average number of orders placed by each customer.',
    },
  ]);
  const [soldProduct, setSoldProduct] = useState<TopSoldProductsType[]>([]);
  const [sourceRevenue, setSourceRevenue] = useState<TopSourceMediumRevenueType[]>([]);
  const [revenueCity, setRevenueCity] = useState<TopRevenueCityType[]>([]);
  const [topRevenueOrderType, setTopRevenueOrderType] = useState<TopRevenueOrderT[]>([]);

  useEffect(() => {
    fetchData(dateSlice.dateRange);
  }, [dateSlice.dateRange, isAuth]);

  const fetchData = async (dateRange: dateStartEnd) => {
    if (parameters?.installation?.licenseKey && isAuth) {
      try {
        dispatch(loadingState(true));
        const [conversionCountRes, soldProductRes, topSourceRes, topRevenueRes, topRevenueOrderTypeRes] = await Promise.all([
          fetchConversionCounts(dateRange),
          fetchSoldProduct(dateRange),
          fetchTopSourceRevenue(dateRange),
          fetchCityRevenue(dateRange),
          fetchTopRevenueOrderType(dateRange),
        ]);

        setRoiConversionCounts([
          {
            ...roiConversionCounts[0],
            countData: conversionCountRes?.data?.data?.totalDeliveries,
          },
          {
            ...roiConversionCounts[1],
            countData: conversionCountRes?.data?.data?.totalTransaction,
          },
          {
            ...roiConversionCounts[2],
            currencySign: getSymbolFromCurrency(conversionCountRes?.data?.data?.totalRevenue.currency),
            countData: conversionCountRes?.data?.data?.totalRevenue,
          },
          {
            ...roiConversionCounts[3],
            countData: conversionCountRes?.data?.data?.averageOrders,
          },
        ]);
        setSoldProduct(soldProductRes);
        setSourceRevenue(
          topSourceRes?.data?.data.map((elm: TopSourceMediumRevenueType, i: number) => {
            return {
              ...elm,
              displayRevenue: formatInput(elm?.revenue, getSymbolFromCurrency(elm?.CurrencyIsoCode)),
              color: barChartColor[i],
              labelColor: barLabelColor[i],
              CurrencyIsoCode: getSymbolFromCurrency(elm?.CurrencyIsoCode),
            };
          }),
        );

        setRevenueCity(
          topRevenueRes?.data?.data?.map((elm: TopRevenueCityType, i: number) => {
            return {
              ...elm,
              color: pieChartColor[i],
              name: commonChartConfig.capitalizeLabel(elm, 'name'),
              CurrencyIsoCode: getSymbolFromCurrency(elm?.CurrencyIsoCode),
            };
          }),
        );
        setTopRevenueOrderType(
          topRevenueOrderTypeRes?.data?.data?.flatMap((elm: any, i: number) => {
            return elm?.dailyRevenue?.map((el: TopRevenueOrderT) => {
              return {
                ...el,
                Type: elm['Type'] == null ? 'null' : elm['Type'],
                color: multiLineChart[i],
                CurrencyIsoCode: getSymbolFromCurrency(elm?.CurrencyIsoCode),
              };
            });
          }),
        );
      } catch (error) {
        console.log('Error occurred during data fetching:', error);
      } finally {
        if (navigationSlice.activeRoute.order === order) dispatch(loadingState(false));
      }
    }
  };

  const fetchConversionCounts = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        '/api/dashboard/roi-conversion',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          sfscTimezone: parameters.installation.sfscTimezone,
          ...dateRange,
        },
        {
          headers: {
            Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
            ['jro34134ecr4aex']: `${encryptData({
              validate: Date.now(),
              token: environment?.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        },
      );
      if (res.status !== 200) {
        console.log('Error occured fetching conversion data');
      }

      return res;
    } catch (error) {
      console.log('Error occured fetching conversion data');
    }
  };

  const fetchSoldProduct = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/roi-conversion/top-products',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          ...dateRange,
          clientTZ: defaultSystemTZ,
        },
        {
          headers: {
            Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
            ['jro34134ecr4aex']: `${encryptData({
              validate: Date.now(),
              token: environment?.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        },
      );

      if (res.status !== 200) console.log('Error occured fetching conversion data');

      // adding category to every objects
      let updatedRes = res.data.data.flatMap((elm: any, i: number) => {
        return elm.dailyRevenue.map((el: TopSoldProductsType) => {
          return {
            ...el,
            category: commonChartConfig.capitalizeLabel(elm, 'Name'),
            color: multiLineChart[i],
            CurrencyIsoCode: getSymbolFromCurrency(elm?.CurrencyIsoCode),
          };
        });
      });

      return updatedRes;
    } catch (err) {
      console.log('Error occured fetching top revenue');
    }
  };

  const fetchTopSourceRevenue = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/roi-conversion/top-source-revenue',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          sfscTimezone: parameters.installation.sfscTimezone,
          ...dateRange,
        },
        {
          headers: {
            Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
            ['jro34134ecr4aex']: `${encryptData({
              validate: Date.now(),
              token: environment?.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        },
      );

      if (res.status !== 200) console.log('Error occured fetching conversion data');

      return res;
    } catch (err) {
      console.log('Error occured fetching top revenue');
    }
  };

  const fetchCityRevenue = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/roi-conversion/top-city-revenue',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          sfscTimezone: parameters.installation.sfscTimezone,
          ...dateRange,
        },
        {
          headers: {
            Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
            ['jro34134ecr4aex']: `${encryptData({
              validate: Date.now(),
              token: environment?.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        },
      );

      if (res.status !== 200) console.log('Error occured fetching conversion data');

      return res;
    } catch (err) {
      console.log('Error occured fetching top revenue');
    }
  };

  const fetchTopRevenueOrderType = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        '/api/dashboard/roi-conversion/top-revenue-by-order-type',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
          ...dateRange,
          clientTZ: defaultSystemTZ,
        },
        {
          headers: {
            Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
            ['jro34134ecr4aex']: `${encryptData({
              validate: Date.now(),
              token: environment?.NEXT_PUBLIC_JWT_TOKEN,
            })}`,
          },
        },
      );

      if (res.status !== 200) console.log('Error occured fetching conversion data');

      return res;
    } catch (err) {
      console.log('Error occured fetching top revenue');
    }
  };

  return (
    <>
      <div className={style.CountCardMAinRow}>
        {roiConversionCounts?.map((el: RoiConversionCounts, index: number) => (
          <CountCard
            cardText={el?.cardText}
            countData={el?.countData}
            currencySign={el?.currencySign}
            key={index}
            icon={el.icon}
            toolTipText={el?.toolTipText}
          />
        ))}
      </div>
      <div className={`${style.CountCardMAinRow} ${themeSlice.theme == 'dark' ? style.DarkTheme : ''}`}>
        <div className={`${style.CountCardInnerProd} ${themeSlice.theme}`}>
          <TopSoldProducts soldProduct={soldProduct} />
        </div>
        <div className={`${style.CountCardInnerProd} ${themeSlice.theme}`}>
          <TopSourceMediumRevenue sourceRevenue={sourceRevenue} />
        </div>
      </div>
      <div className={`${style.CountCardMAinRow} ${themeSlice.theme == 'dark' ? style.DarkTheme : ''}`}>
        <div className={`${style.CountCardInnerProd} ${themeSlice.theme} `}>
          <TopRevenueCity revenueCity={revenueCity} />
        </div>
        <div className={`${style.CountCardInnerProd} ${themeSlice.theme}`}>
          <TopRevenueOrderType topRevenueOrderType={topRevenueOrderType} />
        </div>
      </div>
    </>
  );
}

export default RoiConversion;
