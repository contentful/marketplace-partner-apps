'use client';
import React from 'react';
import style from './topProductRevenue.module.scss';
import NoData from '../../../components/UI/NoData';
import BarChart from '../../../components/charts/BarChart';
import { useAppSelector } from '../../../redux/hooks';

export default function TopProductRevenue({ topProductRevenue }: { topProductRevenue: any }) {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);
  return (
    <div className={` ${style.TopProductMain}  ${theme == 'dark' ? style.DarkTheme : ''}`}>
      <div className={`CanvesData ${style.TopProductInner} ${theme}`}>
        <h4>Top Products Based On Revenue</h4>
        {topProductRevenue?.length ? (
          <BarChart
            data={topProductRevenue}
            xField="productName"
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
