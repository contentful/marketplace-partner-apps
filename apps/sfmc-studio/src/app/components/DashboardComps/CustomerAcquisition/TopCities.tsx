'use client';
import React from 'react';
import style from './topCities.module.scss';
import NoData from '../../../components/UI/NoData';
import BarChart from '../../../components/charts/BarChart';
import { TopCitiesType } from '../../../lib/types/dashboard';

function TopCities({ topCities }: { topCities: TopCitiesType[] }) {
  return (
    <>
      <div className={style.DeviceCategoryMain}>
        <div className={`CanvesData ${style.DeviceCategoryColInner}`}>
          <h3> Top Cities By Order</h3>
          {topCities?.length ? (
            <BarChart data={topCities} xField="name" yField="count" toolTipText="Orders" labelText="count" maxWidth={25} height={320} axisYTitle="Orders" />
          ) : (
            ''
          )}
        </div>
      </div>
      {!topCities?.length ? <NoData /> : ''}
    </>
  );
}

export default TopCities;
