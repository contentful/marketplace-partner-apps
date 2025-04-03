'use client';
import React from 'react';
import style from './campaignClicks.module.scss';
import CustomTable from '../../../components/UI/CustomTable';
import { TableColumnsType, Tooltip } from 'antd';
import { CampaignClicksType } from '../../../lib/types/dashboard';
import { useAppSelector } from '../../../redux/hooks';

export default function CampaignClicks({ campaignClicks }: { campaignClicks: any }) {
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const columns: TableColumnsType<CampaignClicksType> = [
    {
      title: 'No',
      key: 'no',
      render: (value, record, index) => {
        return <span className={theme}>{index + 1}</span>;
      },
    },
    {
      title: 'Campaign',
      dataIndex: 'name',
      key: 'name',
      ellipsis: {
        showTitle: false,
      },
      render: (name) => (
        <Tooltip placement="topLeft" title={name}>
          <span className={theme}>{name}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Clicks',
      dataIndex: 'displayClicks',
      key: 'displayClicks',
      sorter: {
        compare: (a: CampaignClicksType, b: CampaignClicksType) => a.clicks - b.clicks,
        multiple: 2,
      },
      render: (value) => <span className={theme}>{value}</span>,
    },
  ];

  return (
    <div className={style.CampaignClicksMain}>
      <div className={style.CampaignClicksInner}>
        <h4>Top Campaign By Clicks</h4>
        <CustomTable data={campaignClicks} columns={columns} />
      </div>
    </div>
  );
}
