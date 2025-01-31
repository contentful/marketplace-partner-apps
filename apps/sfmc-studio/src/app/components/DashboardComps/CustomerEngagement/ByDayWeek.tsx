'use client';
import React from 'react';
import style from './byDayWeek.module.scss';
import CustomTable from '@/components/UI/CustomTable';
import { TableColumnsType, theme } from 'antd';
import { ByDayWeekType } from '@/lib/types/dashboard';
import { useAppSelector } from '@/redux/hooks';

function ByDayWeek({ dayWeekUniqueOpen }: { dayWeekUniqueOpen: any }) {
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const columns: TableColumnsType<ByDayWeekType> = [
    {
      title: 'No',
      key: 'no',
      render: (value, record, index) => <span className={theme}>{index + 1}</span>,
    },
    {
      title: 'Day',
      dataIndex: 'weekday',
      key: 'weekday',
      render: (value) => <span className={theme}>{value}</span>,
    },
    {
      title: 'Unique Opens',
      dataIndex: 'displayUniqueOpens',
      key: 'displayUniqueOpens',
      sorter: {
        compare: (a: ByDayWeekType, b: ByDayWeekType) => a.unique - b.unique,
        multiple: 2,
      },
      render: (unique: number) => <span className={theme}>{unique}</span>,
    },
  ];

  return (
    <div className={`${style.ByDayWeekMain} ${theme == 'dark' ? style.DarkTheme : ''}`}>
      <div className={`${style.ByDayWeekInner} ${theme}`}>
        <h4>By Day Of The Week</h4>
        <CustomTable data={dayWeekUniqueOpen} columns={columns} showTotal={true} />
      </div>
    </div>
  );
}

export default ByDayWeek;
