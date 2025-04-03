'use client';
import CountCard from '../../../components/UI/CountCard';
import React, { useEffect, useState } from 'react';
import style from './customerRetention.module.scss';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { ApiClient } from '../../../lib/ApiClients';
import RevenueBySource from './RevenueBySource';
import OrderByStatus from './OrderByStatus';
import SoldProduct from './SoldProduct';
import TopProductRevenue from './TopProductRevenue';
import TopProductSku from './TopProductSku';
import TopProductFamily from './TopProductFamily';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { dateStartEnd } from '../../../redux/slices/dateSlice';
import { loadingState } from '../../../redux/slices/loadersSlice';
import { barChartColor, barLabelColor, multiLineChart, pieChartColorDiff } from '../../../lib/utils/getColor';
import {
  OrderByStatusRetention,
  RetentionCounts,
  RevenueBySourceRetention,
  SoldProductsRetention,
  TopProductRevenueRetention,
  TopProductSkuType,
} from '../../../lib/types/dashboard';
import { commonChartConfig } from '../../../lib/utils/dashboards';
import { encryptData, formatInput } from '../../../lib/utils/common';
import { defaultSystemTZ } from '../../../lib/utils/common';
import svgIcons from '../../../lib/utils/icons';
import getSymbolFromCurrency from 'currency-symbol-map';
import { environment } from '../../../lib/Constants';

function CustomerRetention({ order }: { order: number }) {
  const { parameters } = useSDK<PageAppSDK>();
  const client = ApiClient();
  const dispatch = useAppDispatch();
  let { CustomerRetentionIcon } = svgIcons;
  const {
    dateSlice,
    navigationSlice,
    authSlice: { isAuth },
  } = useAppSelector((state) => state);

  const [retentionCounts, setRetentionCounts] = useState<RetentionCounts[]>([
    {
      cardText: 'Total Sales',
      countData: { count: 0, change: 0 },
      currencySign: '',
      icon: CustomerRetentionIcon?.totalSales,
      toolTipText: 'Total revenue generated through completed sales.',
    },
    {
      cardText: 'Average Order Value',
      countData: { count: 0, change: 0 },
      currencySign: '',
      icon: CustomerRetentionIcon?.averageOrderValue,
      toolTipText: 'The average value of revenue generated per order.',
    },
    {
      cardText: 'Total Orders',
      countData: { count: 0, change: 0 },
      icon: CustomerRetentionIcon?.orders,
      toolTipText: 'Total number of orders placed.',
    },
    {
      cardText: 'New Customers',
      countData: { count: 0, change: 0 },
      icon: CustomerRetentionIcon?.newCustomers,
      toolTipText: 'Number of newly acquired customers.',
    },
  ]);
  const [revenueSource, setRevenueSource] = useState<RevenueBySourceRetention[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderByStatusRetention[]>([]);

  const [topProductRevenue, setTopProductRevenue] = useState<TopProductRevenueRetention[]>([]);
  const [topProductSku, setTopProductSku] = useState<TopProductSkuType[]>([]);
  const [topProductFamily, setTopProductFamily] = useState<any>([]);
  const [soldProduct, setSoldProduct] = useState<SoldProductsRetention[]>();

  useEffect(() => {
    fetchData(dateSlice.dateRange);
  }, [dateSlice.dateRange, isAuth]);

  const fetchData = async (dateRange: dateStartEnd) => {
    if (parameters?.installation?.licenseKey && isAuth) {
      try {
        dispatch(loadingState(true));
        const [retentionCountsRes, revenueSourceRes, orderStatusRes, topProductRevenueRes, topProductSkuRes, topProductFamilyRes, topSoldProductsRes] =
          await Promise.all([
            fetchRetentionCounts(dateRange),
            fetchRevenueSource(dateRange),
            fetchOrderByStatus(dateRange),
            fetchTopProductRevenue(dateRange),
            fetchTopProductSku(dateRange),
            fetchTopProductFamily(dateRange),
            fetchSoldProduct(dateRange),
          ]);

        setRetentionCounts([
          {
            ...retentionCounts[0],
            countData: retentionCountsRes?.data?.data?.totalAmount,
            currencySign: getSymbolFromCurrency(retentionCountsRes?.data?.data?.totalAmount?.currency),
          },
          {
            ...retentionCounts[1],
            currencySign: getSymbolFromCurrency(retentionCountsRes?.data?.data?.averageOrderValue?.currency),
            countData: retentionCountsRes?.data?.data?.averageOrderValue,
          },
          {
            ...retentionCounts[2],
            countData: retentionCountsRes?.data?.data?.totalOrders,
          },
          {
            ...retentionCounts[3],
            countData: retentionCountsRes?.data?.data?.newClients,
          },
        ]);
        setRevenueSource(
          revenueSourceRes?.data?.data.map((elm: RevenueBySourceRetention, i: number) => {
            return {
              ...elm,
              color: pieChartColorDiff[i],
              CurrencyIsoCode: getSymbolFromCurrency(elm?.CurrencyIsoCode),
            };
          }),
        );
        setOrderStatus(
          orderStatusRes?.data?.data?.map((elm: OrderByStatusRetention, i: number) => {
            return { ...elm, color: pieChartColorDiff[i] };
          }),
        );
        setTopProductRevenue(
          topProductRevenueRes?.data?.data?.map((elm: TopProductRevenueRetention, i: number) => {
            return {
              ...elm,
              productName: commonChartConfig.capitalizeLabel(elm, 'productName'),
              displayRevenue: formatInput(elm?.revenue, getSymbolFromCurrency(elm?.CurrencyIsoCode)),
              color: barChartColor[i],
              labelColor: barLabelColor[i],
              CurrencyIsoCode: getSymbolFromCurrency(elm?.CurrencyIsoCode),
            };
          }),
        );
        setTopProductSku(
          topProductSkuRes?.data?.data?.map((elm: TopProductSkuType, i: number) => {
            return {
              ...elm,
              productSKU: elm.productSKU == 'Others' ? 'Not Set' : elm.productSKU,
              displayRevenue: formatInput(elm?.revenue, getSymbolFromCurrency(elm?.CurrencyIsoCode)),
              color: barChartColor[i],
              labelColor: barLabelColor[i],
              CurrencyIsoCode: getSymbolFromCurrency(elm?.CurrencyIsoCode),
            };
          }),
        );
        setTopProductFamily(topProductFamilyRes);
        setSoldProduct(topSoldProductsRes);
      } catch (error) {
        console.log('Error occurred during data fetching:', error);
      } finally {
        if (navigationSlice.activeRoute.order === order) dispatch(loadingState(false));
      }
    }
  };

  const fetchRetentionCounts = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        '/api/dashboard/customer-retention',
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

  const fetchRevenueSource = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/customer-retention/revenue-by-source',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
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

  const fetchOrderByStatus = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/customer-retention/order-by-status',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
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

  const fetchTopProductRevenue = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/customer-retention/products-by-revenue',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
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

  const fetchTopProductSku = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/customer-retention/top-products-sku',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
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

  const fetchTopProductFamily = async (dateRange: dateStartEnd) => {
    try {
      const res = await client.post(
        'api/dashboard/customer-retention/top-sold-family',
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

      if (res.status !== 200) console.log('Error occured fetching conversion data top product family');

      const uniqueFamilies: string[] = [];

      res?.data?.data.forEach((item: { date: string; data: { family: string; revenue: number }[] }) => {
        item.data.forEach((entry) => {
          if (!uniqueFamilies.includes(entry.family)) {
            uniqueFamilies.push(entry.family);
          }
        });
      });

      const requiredData: any = res?.data?.data.flatMap(
        ({ date, data }: { date: string; data: { family: string; revenue: number; CurrencyIsoCode: string }[] }) => {
          return data.map(({ family, revenue, CurrencyIsoCode }) => {
            return {
              date,
              family,
              revenue,
              color: multiLineChart[uniqueFamilies.findIndex((val) => val == family)],
              CurrencyIsoCode: getSymbolFromCurrency(CurrencyIsoCode),
            };
          });
        },
      );

      return requiredData;
    } catch (err) {
      console.log('Error occured fetching top product family');
    }
  };

  const fetchSoldProduct = async (dateRange: dateStartEnd) => {
    try {
      const client = ApiClient();
      const res = await client.post(
        'api/dashboard/customer-retention/top-sold-products',
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
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
      const data = res?.data?.data?.map((item: any, index: number) => ({
        ...item,
        productName: commonChartConfig.capitalizeLabel(item, 'productName'),
        displaySoldAmount: formatInput(item.soldAmount),
        displayRevenue: formatInput(item.revenue, getSymbolFromCurrency(item?.CurrencyIsoCode)),
        key: item?._id ? item?._id : `${index}`,
      }));

      return data;
    } catch (err) {
      console.log('Error occured fetching top revenue');
    }
  };

  return (
    <>
      <div className={style.RetaionCardMAinRow}>
        {retentionCounts?.map((el: RetentionCounts, index: number) => (
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

      <div className={style.RetaionCardMAinRow}>
        <RevenueBySource revenueSource={revenueSource} />
        <OrderByStatus orderStatus={orderStatus} />
      </div>
      <SoldProduct soldProduct={soldProduct} />
      <div className={style.RetaionCardMAinRow}>
        <TopProductRevenue topProductRevenue={topProductRevenue} />
        <TopProductSku topProductSku={topProductSku} />
      </div>
      <div className={style.RetaionCardMAinRow}>
        <TopProductFamily topProductFamily={topProductFamily} />
      </div>
    </>
  );
}

export default CustomerRetention;
