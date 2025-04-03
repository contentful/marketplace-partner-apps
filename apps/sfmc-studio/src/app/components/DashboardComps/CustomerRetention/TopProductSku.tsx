'use client';
import React from 'react';
import style from './topProductSku.module.scss';
import NoData from '../../../components/UI/NoData';
import BarChart from '../../../components/charts/BarChart';
import { useAppSelector } from '../../../redux/hooks';

export default function TopProductSku({ topProductSku }: { topProductSku: any }) {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);
  return (
    <div className={`${style.TopSkuMain} ${theme == 'dark' ? style.DarkTheme : ''}`}>
      <div className={`CanvesData ${style.TopSkuInner} ${theme}`}>
        <h4>Top Product SKU</h4>
        {topProductSku?.length ? (
          <BarChart
            data={topProductSku}
            xField="productSKU"
            yField="revenue"
            labelText="displayRevenue"
            maxWidth={25}
            height={320}
            axisYTitle=""
            toolTipText="Revenue"
          />
        ) : (
          <NoData />
        )}
      </div>
    </div>
  );
}
