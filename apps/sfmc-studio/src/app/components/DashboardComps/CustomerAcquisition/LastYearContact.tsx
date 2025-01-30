"use client";
import React from "react";
import style from "./newContacts.module.scss";
import NoData from "@/components/UI/NoData";
import LineChart from "@/components/charts/LineChart";

function LastYearContact({ lastYearContact }: { lastYearContact: any }) {
  return (
    <div className={style.NewContactsMain}>
      <div className={`CanvesData ${style.NewContactsInner}`}>
        <h3>New Contacts In The Last Six Months</h3>
        <p>{}</p>
        {lastYearContact?.length ? (
          <LineChart
            data={lastYearContact}
            xField="month"
            yField="count"
            dateShow={false}
            axisXTitle="* This graph is being populated regardless of the date filter applied."
            axisYTitle=""
            toolTipText="New Contacts"
            showAnnotations={true}
            height={325}
            labelFormatter={false}
          />
        ) : (
          <NoData />
        )}
      </div>
    </div>
  );
}

export default LastYearContact;
