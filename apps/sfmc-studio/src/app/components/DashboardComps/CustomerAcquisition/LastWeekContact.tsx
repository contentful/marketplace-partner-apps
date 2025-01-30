"use client";
import React from "react";
import style from "./newContacts.module.scss";
import NoData from "@/components/UI/NoData";
import LineChart from "@/components/charts/LineChart";
import { useAppSelector } from "@/redux/hooks";

function LastWeekContact({ lastWeekContact }: { lastWeekContact: any }) {
  const theme: string = useAppSelector((state) => state.themeSlice?.theme);
  return (
    <>
      <div className={style.NewContactsMain}>
        <div className={`CanvesData ${style.NewContactsInner}`}>
          <h3>New Contacts From Last Week</h3>
          <p></p>
          {lastWeekContact?.length ? (
            <LineChart
              data={lastWeekContact}
              xField="day"
              yField="count"
              dateShow={false}
              axisXTitle="* This graph is being populated regardless of the date filter applied."
              axisYTitle=""
              toolTipText="New Contacts"
              showAnnotations={true}
              height={325}
              labelFormatter={true}
            />
          ) : (
            ""
          )}
        </div>
      </div>
      {!lastWeekContact?.length ? <NoData /> : ""}
    </>
  );
}

export default LastWeekContact;
