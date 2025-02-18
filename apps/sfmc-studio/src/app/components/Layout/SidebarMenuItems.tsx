'use client';
import React, { useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Layout, Menu } from 'antd';
const { Sider } = Layout;
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { addMenuArr, changeRoute } from '../../redux/slices/navigationSlice';
import parse from 'html-react-parser';
import svgIcons from '../../lib/utils/icons';
import { ApiClient } from '../../lib/ApiClients';
import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';
import { encryptData, saveOrValidateLicenseKey } from '../../lib/utils/common';
import { setIsAuth } from '../../redux/slices/authSlice';
import { openNotification } from '../../lib/utils/dashboards';
import { AppInstallationParametersKeys } from '../../lib/AppConfig';

function SidebarMenuItems({ collapsed }: { collapsed: boolean }) {
  const dispatch = useAppDispatch();
  const client = ApiClient();
  const {
    parameters,
    ids: { space: spaceId },
  } = useSDK<PageAppSDK>();
  const { navigationSlice, loaderSlice, themeSlice } = useAppSelector((state) => state);

  useEffect(() => {
    if (navigationSlice?.activeRoute?._id) {
      if (
        !parameters?.installation?.[AppInstallationParametersKeys.SFMC_DOMAIN] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFMC_MARKETING_ID] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFMC_CLIENT_ID] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFMC_CLIENT_SECRET] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFSC_URL] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFSC_CLIENT_ID] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFSC_CLIENT_SECRET] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFSC_USERNAME] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFSC_PASSWORD] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFMC_TIMEZONE] ||
        !parameters?.installation?.[AppInstallationParametersKeys.SFSC_TIMEZONE]
      ) {
        openNotification({
          message: 'Configuration Incomplete',
          description:
            "It seems you haven't filled in all the required details in the configuration. Please ensure that all fields are properly filled before proceeding.",
          type: 'error',
          theme: themeSlice.theme,
        });
      }
    }
  }, [navigationSlice?.activeRoute]);

  useEffect(() => {
    if (parameters?.installation?.licenseKey) {
      authenticateUser();
      fetchMenu();
    } else if (!parameters?.installation?.[AppInstallationParametersKeys.LICENSE_KEY]) {
      openNotification({
        message: 'Configuration Incomplete',
        description:
          "It seems you haven't filled in all the required details in the configuration. Please ensure that all fields are properly filled before proceeding.",
        type: 'error',
        theme: themeSlice.theme,
      });
    }
  }, []);

  const authenticateUser = useCallback(async () => {
    try {
      if (parameters.installation.licenseKey) {
        const res = await saveOrValidateLicenseKey(parameters.installation.licenseKey, spaceId, client);
        if (res?.status === 200) {
          dispatch(setIsAuth(true));
        }
      }
    } catch (error: any) {
      switch (error?.response?.status) {
        case 200:
          break;
        case 404:
          openNotification({
            message: 'License Key',
            description: error?.response?.data?.message ?? 'License Key not found',
            type: 'error',
            theme: themeSlice.theme,
          });

          dispatch(setIsAuth(false));
          break;
        case 400:
          openNotification({
            message: 'License Key',
            description: error?.response?.data?.message ?? 'License Key already exists with other space.',
            type: 'error',
            theme: themeSlice.theme,
          });

          dispatch(setIsAuth(false));
          break;

        default:
          openNotification({
            message: 'License Key',
            description: error?.response?.data?.message ?? 'License Key validation failed.',
            type: 'error',
            theme: themeSlice.theme,
          });

          dispatch(setIsAuth(false));
          break;
      }
    }
  }, [client, dispatch, parameters.installation.licenseKey, spaceId]);

  const fetchMenu = async () => {
    try {
      if (parameters?.installation?.licenseKey) {
        const res = await client.post('/api/dashboard/dashboard-config/get-menu', {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
        });
        if (res.status !== 200) console.log('Error occured fetching contact counts');

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
    <Sider trigger={null} collapsible collapsed={collapsed} className={`SidebarMain ${themeSlice.theme}`} data-testid="sidebar-menu-items" width="320px">
      <div className="demo-logo-vertical" />
      <div className="LogoImage">
        <Link href={''}>
          <Image
            src={
              collapsed
                ? '/images/SFMC_Studio_Logo_icon.svg'
                : themeSlice.theme == 'dark'
                  ? '/images/SFMC_Studio_Logo_dark.svg'
                  : '/images/SFMC_Studio_Logo.svg'
            }
            width={collapsed ? '69' : '200'}
            height={collapsed ? '30' : '40'}
            alt="Logo"
          />
        </Link>
      </div>
      <Menu
        className={`MenuSideBarMain  ${themeSlice.theme}`}
        mode="inline"
        defaultSelectedKeys={['1']}
        items={navigationSlice?.menu?.map((el: any) => {
          const icon = JSON.parse(el.icon);
          return { ...el, icon: parse(icon) };
        })}
        onClick={(e: any) => {
          if (navigationSlice.activeRoute._id !== e?.item?.props?._id) navigating(e);
        }}></Menu>
    </Sider>
  );
}

export default SidebarMenuItems;
