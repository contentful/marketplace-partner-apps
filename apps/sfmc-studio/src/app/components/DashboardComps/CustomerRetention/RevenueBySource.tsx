'use client';
import React from 'react';
import style from './revenueBySource.module.scss';
import { formatInput } from '../../../lib/utils/common';
import NoData from '../../../components/UI/NoData';
import PieChartWithRadius from '../../../components/charts/PieChart';
import { RevenueBySourceRetention } from '../../../lib/types/dashboard';
import { useAppSelector } from '../../../redux/hooks';

function RevenueBySource({ revenueSource }: { revenueSource: any }) {
  let theme: string = useAppSelector((state) => state.themeSlice?.theme);
  return (
    <div className={`${style.RevanueMain} ${theme == 'dark' ? style.DarkTheme : ''}`}>
      <div className={`${style.RevanueInner} ${theme}`}>
        <h4>Revenue By Source</h4>
        <div className={style.CanvesDataGrapInner}>
          <div className={style.CanvesGrapInner}>
            {revenueSource?.length ? (
              <PieChartWithRadius data={revenueSource} angleField="revenue" colorField="name" innerRadius={0.6} width={280} height={300} />
            ) : (
              ''
            )}
          </div>
          <div className={style.CanvesDataTable}>
            <table className={style.CanvesMarkerTable}>
              {revenueSource?.map((el: RevenueBySourceRetention, index: number) => (
                <tr key={index} className={`${theme}-tr`}>
                  <td className={style.CanvesMarkerInner}>
                    <span className={style.MarkerCanves} style={{ backgroundColor: el.color }}></span>
                  </td>
                  <td>{el?.name}</td>
                  <td>{formatInput(el?.revenue, el?.CurrencyIsoCode)}</td>
                </tr>
              ))}
            </table>
          </div>
        </div>
        {!revenueSource?.length ? <NoData /> : ''}
      </div>
    </div>
  );
}

export default RevenueBySource;
