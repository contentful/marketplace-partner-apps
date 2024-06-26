"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Layout, Menu } from "antd";
const { Sider } = Layout;
import { useAppDispatch, useAppSelector } from "src/app/redux/hooks";
import { addMenuArr, changeRoute } from "src/app/redux/slices/navigationSlice";
import parse from "html-react-parser";
import svgIcons from "@/lib/utils/icons";
import { ApiClient } from "@/lib/ApiClients";
import { useSDK } from "@contentful/react-apps-toolkit";
import { PageAppSDK } from "@contentful/app-sdk";

function SidebarMenuItems({ collapsed }: { collapsed: boolean }) {
  const dispatch = useAppDispatch();
  const client = ApiClient();
  const { parameters } = useSDK<PageAppSDK>();
  const { navigationSlice, loaderSlice, themeSlice } = useAppSelector(
    (state) => state
  );

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      if (parameters?.installation?.licenseKey) {
        const res = await client.post(
          "/api/dashboard/dashboard-config/get-menu",
          {
            licenseKey: parameters.installation.licenseKey,
          }
        );
        if (res.status !== 200)
          console.log("Error occured fetching contact counts");

        let updatedMenu = res?.data?.data?.map((el: any) => ({
          ...el,
          label: el.menulabel,
          key: el.order.toString(),
          icon: JSON.stringify(svgIcons[el.link as keyof typeof svgIcons]),
        }));

        dispatch(addMenuArr(updatedMenu));
        if (updatedMenu?.length) {
          const { _id, heading, menulabel, order } = updatedMenu[0];
          dispatch(changeRoute({ _id, heading, menulabel, order }));
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const navigating = (event: any) => {
    let { _id, heading, menulabel, order } = event?.item?.props;
    dispatch(changeRoute({ _id, heading, menulabel, order }));
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className={`SidebarMain ${themeSlice.theme}`}
      width="320px"
    >
      <div className="demo-logo-vertical" />
      <div className="LogoImage">
        <Link href={""}>
          <Image
            src={
              collapsed
                ? "/images/SFMC_Studio_Logo_icon.svg"
                : themeSlice.theme == "dark"
                ? "/images/SFMC_Studio_Logo_dark.svg"
                : "/images/SFMC_Studio_Logo.svg"
            }
            width={collapsed ? "69" : "200"}
            height={collapsed ? "30" : "40"}
            alt="Logo"
          />
        </Link>
      </div>
      <Menu
        className={`MenuSideBarMain  ${themeSlice.theme}`}
        mode="inline"
        defaultSelectedKeys={["1"]}
        items={navigationSlice?.menu?.map((el: any) => {
          const icon = JSON.parse(el.icon);
          return { ...el, icon: parse(icon) };
        })}
        onClick={(e: any) => {
          if (navigationSlice.activeRoute._id !== e?.item?.props?._id)
            navigating(e);
        }}
      ></Menu>
    </Sider>
  );
}

export default SidebarMenuItems;
