'use client';
import React from 'react';
import style from './customerAcquisitionCounts.module.scss';
import parse from 'html-react-parser';
import svgIcons from '../../../lib/utils/icons';
import { formatInput } from '../../../lib/utils/common';
import { ContactCounts } from '../../../lib/types/dashboard';
import { useAppSelector } from '../../../redux/hooks';
import { Tooltip } from 'antd';

function CustomerAcquisitionCounts({ contactCounts }: { contactCounts: ContactCounts }) {
  const { loaderSlice, themeSlice } = useAppSelector((state) => state);
  let { TooltipIcon } = svgIcons;

  const { totalContacts, newContacts } = contactCounts;
  return (
    <div className={`${style.AcquistionCustomerMainWithHead} ${themeSlice?.theme} ${themeSlice.theme == 'dark' ? style.DarkTheme : ''}`}>
      <h2 className={style.AcquisitionHead}>Customer Acquisition</h2>
      <div className={`${style.CustomerAcquisitionMain} ${themeSlice.theme} ${themeSlice.theme == 'dark' ? style.DarkTheme : ''}`}>
        <div className={style.AcquisitionFlexCol}>
          <div className={style.AcquisitionFlexColInner}>
            <div className={style.AcquisitionIcon}>
              <span>{parse(svgIcons.TotalContactIcon || '')}</span>
            </div>
            <div className={style.AcquisitionContentRight}>
              <p>Total Contacts</p>
              <h3>{formatInput(totalContacts)}</h3>
            </div>
            <div className={`countDark ${themeSlice.theme}`}>
              <Tooltip title={'Total number of contacts in SFSC.'} overlayClassName={themeSlice.theme}>
                <div className="ToolTipDark">{parse(TooltipIcon || '')}</div>
              </Tooltip>
            </div>
          </div>
          <div className={style.AcquisitionFlexColInner}>
            <div className={style.AcquisitionIcon}>
              <span>{parse(svgIcons.NewContactIcon || '')}</span>
            </div>
            <div className={style.AcquisitionContentRight}>
              <p>New Contacts</p>
              <h3>{formatInput(newContacts)}</h3>
            </div>
            <div className={`countDark  ${themeSlice.theme}`}>
              <Tooltip title={'New Contacts added to SFSC today.'} overlayClassName={themeSlice.theme}>
                <div className="ToolTipDark">{parse(TooltipIcon || '')}</div>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerAcquisitionCounts;
