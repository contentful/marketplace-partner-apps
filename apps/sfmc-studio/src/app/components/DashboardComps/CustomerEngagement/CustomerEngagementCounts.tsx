'use client';
import CountCard from '@/components/UI/CountCard';
import React from 'react';
import style from './customerEngagementCounts.module.scss';
import { CountDataType } from '@/lib/types/dashboard';

function CustomerEngagementCounts({ firstRowCountData, secondRowCountData }: { firstRowCountData: any; secondRowCountData: any }) {
  return (
    <>
      <div className={style.CountCardMAinRow}>
        {firstRowCountData?.map((elm: CountDataType, i: number) => (
          <CountCard cardText={elm?.cardText} countData={elm?.count} key={i} icon={elm?.icon} toolTipText={elm?.toolTipText} />
        ))}
      </div>
      <div className={style.CountCardMAinRow}>
        {secondRowCountData?.map((el: CountDataType, index: number) => (
          <CountCard cardText={el?.cardText} countData={el?.count} key={index} icon={el?.icon} toolTipText={el?.toolTipText} />
        ))}
      </div>
    </>
  );
}

export default CustomerEngagementCounts;
