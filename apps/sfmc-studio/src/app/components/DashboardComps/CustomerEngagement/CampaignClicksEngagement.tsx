'use client';
import React from 'react';
import style from './campaignClicksEngagement.module.scss';
import NoData from '../../../components/UI/NoData';
import BarChart from '../../../components/charts/BarChart';
import { useAppSelector } from '../../../redux/hooks';

export default function CampaignClicksEngagement({ campaignClickUnique }: { campaignClickUnique: any }) {
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);

  return (
    <div className={`${style.CampaignClicksEngagement} ${theme == 'dark' ? style.DarkTheme : ''}`}>
      <div className={`CanvesData ${style.CampaignClicksEngagementInner}  ${theme}`}>
        <h3>Unique Campaign Clicks</h3>
        {/* <p>Unique Clicks</p> */}
        {campaignClickUnique?.length ? (
          <BarChart
            data={campaignClickUnique}
            xField="name"
            yField="clicks"
            labelText="displayClicks"
            maxWidth={30}
            height={450}
            axisYTitle=""
            toolTipText="Clicks"
          />
        ) : (
          <NoData />
        )}
      </div>
    </div>
  );
}
