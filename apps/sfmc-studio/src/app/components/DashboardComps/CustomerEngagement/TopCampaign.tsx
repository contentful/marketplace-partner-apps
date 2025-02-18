'use client';
import React from 'react';
import style from './topCampaign.module.scss';
import CustomTable from '../../../components/UI/CustomTable';
import { TableColumnsType, Tooltip } from 'antd';
import { CampaignSentsType } from '../../../lib/types/dashboard';

function TopCampaign({ campaignSents }: { campaignSents: any }) {
  const columns: TableColumnsType<CampaignSentsType> = [
    {
      title: 'No',
      key: 'no',
      render: (value, record, index) => {
        return index + 1;
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
          {name}
        </Tooltip>
      ),
    },
    {
      title: 'Sends',
      dataIndex: 'displaySents',
      key: 'displaySents',
      sorter: {
        compare: (a: CampaignSentsType, b: CampaignSentsType) => a.sents - b.sents,
        multiple: 2,
      },
    },
  ];

  return (
    <div className={style.TopCampaignMainCtr}>
      <div className={style.TopCampaignCtrInner}>
        <h4>Top Campaign By Sends</h4>
        <CustomTable data={campaignSents} columns={columns} />
      </div>
    </div>
  );
}

export default TopCampaign;
