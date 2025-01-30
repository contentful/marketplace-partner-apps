'use client';
import React from 'react';
import style from './campaignClicks.module.scss';
import CustomTable from '@/components/UI/CustomTable';
import { TableColumnsType, Tooltip } from 'antd';
import { CampaignClicksSentsOpensType } from '@/lib/types/dashboard';
import { useAppSelector } from '@/redux/hooks';

export default function CampaignClicksSentsOpens({ campaignClicksSentsOpens }: { campaignClicksSentsOpens: any }) {
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);
  const columns: TableColumnsType<CampaignClicksSentsOpensType> = [
    {
      title: 'No',
      key: 'no',
      render: (value, record, index) => <span className={theme}>{index + 1}</span>,
    },
    {
      title: 'Campaign',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Tooltip placement="topLeft" title={name}>
          {name}
        </Tooltip>
      ),
    },
    {
      title: 'Sends',
      dataIndex: 'displaySents',
      key: 'displaySents',
      sorter: {
        compare: (a: CampaignClicksSentsOpensType, b: CampaignClicksSentsOpensType) => a.sents - b.sents,
      },
      render: (sents: number) => <span className={theme}>{sents}</span>,
    },
    {
      title: 'Opens',
      dataIndex: 'displayOpens',
      key: 'displayOpens',
      sorter: {
        compare: (a: CampaignClicksSentsOpensType, b: CampaignClicksSentsOpensType) => a.opens - b.opens,
      },
      render: (opens: number) => <span className={theme}>{opens}</span>,
    },
    {
      title: 'Clicks',
      dataIndex: 'displayClicks',
      key: 'displayClicks',
      sorter: {
        compare: (a: CampaignClicksSentsOpensType, b: CampaignClicksSentsOpensType) => a.clicks - b.clicks,
      },
      render: (clicks: number) => <span className={theme}>{clicks}</span>,
    },
  ];

  return (
    <div className={`${style.CampaignClicksMain} ${theme == 'dark' ? style.DarkTheme : ''}`}>
      <div className={`${style.CampaignClicksInner} ${theme}`}>
        <h4>Top Campaigns</h4>
        <CustomTable data={campaignClicksSentsOpens} columns={columns} />
      </div>
    </div>
  );
}
