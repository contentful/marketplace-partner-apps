"use client";
import React, { use, useCallback, useEffect, useState, useRef } from "react";
import { Layout, Button, theme } from "antd";
const { Header, Content } = Layout;
import { useAppSelector } from "src/app/redux/hooks";
import { AppInstallationParametersKeys } from "@/lib/AppConfig";
import RoiConversion from "../DashboardComps/ROIConversion/RoiConversion";
import CustomerRetention from "../DashboardComps/CustomerRetention/CustomerRetention";
import CustomerAcquisition from "../DashboardComps/CustomerAcquisition/CustomerAcquisition";
import CustomerEngagement from "../DashboardComps/CustomerEngagement/CustomerEngagement";
import Image from "next/image";
import parse from "html-react-parser";
import svgIcons from "@/lib/utils/icons";
import { useSDK } from "@contentful/react-apps-toolkit";
import { ConfigAppSDK, PageAppSDK } from "@contentful/app-sdk";
import DatePicker from "../UI/DatePicker";
import { ApiClient } from "@/lib/ApiClients";
import { useAppDispatch } from "src/app/redux/hooks";
import { showError } from "src/app/redux/slices/notificationSlice";
import CustomNotification from "../UI/CustomNotification";
import Loader from "../Loader/Loader";
import { addMenuArr, changeRoute } from "src/app/redux/slices/navigationSlice";
import debounce from "lodash/debounce";
import jsPDF from "jspdf";
import { toCanvas } from "html-to-image";
import { themeChange } from "src/app/redux/slices/themeSlice";
import { Switch } from "antd";
import {
  clientCredsCookieName,
  CookieHelpers,
  saveOrValidateLicenseKey,
} from "@/lib/utils/common";
import { setIsAuth } from "src/app/redux/slices/authSlice";

const RenderSwitch = ({ order }: { order: number }) => {
  switch (order) {
    case 1:
      return <CustomerAcquisition order={order} />;
    case 2:
      return <CustomerEngagement order={order} />;
    case 3:
      return <CustomerRetention order={order} />;
    case 4:
      return <RoiConversion order={order} />;
  }
};

export default function RightLayout({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const client = ApiClient();
  const dispatch = useAppDispatch();
  const pdfRef = useRef<any>();
  const {
    parameters,
    ids: { space: spaceId },
  } = useSDK<PageAppSDK>();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { navigationSlice, loaderSlice, authSlice, themeSlice } =
    useAppSelector((state) => state);
  const {
    parameters: {
      installation: { companyName, companyLogoUrl },
    },
  } = useSDK<ConfigAppSDK>();
  const [companyLogoSrc, setCompanyLogoSrc] = useState(companyLogoUrl);
  const [edit, setEdit] = useState<boolean>(false);
  const [pdfLoading, setPdfLoadings] = useState<boolean>(false);

  useEffect(() => {
    if (
      !parameters?.installation?.[AppInstallationParametersKeys.LICENSE_KEY] ||
      !parameters?.installation?.[AppInstallationParametersKeys.SFMC_DOMAIN] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFMC_MARKETING_ID
      ] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFMC_CLIENT_ID
      ] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFMC_CLIENT_SECRET
      ] ||
      !parameters?.installation?.[AppInstallationParametersKeys.SFSC_URL] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFSC_CLIENT_ID
      ] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFSC_CLIENT_SECRET
      ] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFSC_USERNAME
      ] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFSC_PASSWORD
      ] ||
      !parameters?.installation?.[
        AppInstallationParametersKeys.SFMC_TIMEZONE
      ] ||
      !parameters?.installation?.[AppInstallationParametersKeys.SFSC_TIMEZONE]
    ) {
      dispatch(
        showError({
          showAlert: true,
          message: "Configuration Incomplete",
          description:
            "It seems you haven't filled in all the required details in the configuration. Please ensure that all fields are properly filled before proceeding.",
          type: "error",
        })
      );
    } else {
      authenticateUser();
    }
  }, [navigationSlice?.activeRoute]);

  const dataSync = async () => {
    try {
      if (parameters?.installation?.licenseKey && authSlice?.isAuth) {
        const salesSync = await client.post("/api/sync/sales-data", {
          baseUrl:
            parameters?.installation?.[AppInstallationParametersKeys.SFSC_URL],
          username:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFSC_USERNAME
            ],
          password:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFSC_PASSWORD
            ],
          clientId:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFSC_CLIENT_ID
            ],
          clientSecret:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFSC_CLIENT_SECRET
            ],
          licenseKey:
            parameters?.installation?.[
              AppInstallationParametersKeys.LICENSE_KEY
            ],
          sfscTimezone:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFSC_TIMEZONE
            ],
        });

        const marketingSync = await client.post("/api/sync/marketing-data", {
          licenseKey:
            parameters?.installation?.[
              AppInstallationParametersKeys.LICENSE_KEY
            ],
          sfmcSubdomain:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFMC_DOMAIN
            ],
          sfmcclientId:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFMC_CLIENT_ID
            ],
          sfmcclientSecret:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFMC_CLIENT_SECRET
            ],
          sfmcTimezone:
            parameters?.installation?.[
              AppInstallationParametersKeys.SFMC_TIMEZONE
            ],
        });

        if (marketingSync.status !== 200 || salesSync.status !== 200) {
          dispatch(
            showError({
              showAlert: true,
              message: "Failure",
              description: "Error occured in  data sync",
              type: "error",
            })
          );
          console.log("Error occured in  data sync");
        }

        if (salesSync.status == 200 || marketingSync.status == 200) {
          dispatch(
            showError({
              showAlert: true,
              message: "Success",
              description:
                "Sync triggered successfully. Data should be updated in few mins",
              type: "success",
            })
          );
        }
      }
    } catch (err) {
      console.log(err);
      dispatch(
        showError({
          showAlert: true,
          message: "Failure",
          description: "Please verify configuration details.",
          type: "error",
        })
      );
    }
  };

  const updatingHeading = async (e: any) => {
    e.preventDefault();

    const res = await client.post(
      "/api/dashboard/dashboard-config/update-menu",
      {
        licenseKey: parameters.installation.licenseKey,
        heading: e.target.value,
        _id: navigationSlice?.activeRoute._id,
        menulable: e.target.value,
      }
    );
    if (res.status === 200) {
      const list = await client.post(
        "/api/dashboard/dashboard-config/get-menu",
        { licenseKey: parameters.installation.licenseKey }
      );

      let updatedMenu = list?.data?.data?.map((el: any) => ({
        ...el,
        label: el.menulabel,
        key: el.order.toString(),
        icon: JSON.stringify(svgIcons[el.link as keyof typeof svgIcons]),
      }));

      dispatch(addMenuArr(updatedMenu));
    }
  };

  const debouncedUpdateHeader = debounce(updatingHeading, 500);

  const handleHeading = async (e: any) => {
    e.persist();
    dispatch(
      changeRoute({
        ...navigationSlice?.activeRoute,
        heading: e.target.value,
        menulabel: e.target.value,
      })
    );
    debouncedUpdateHeader(e);
  };

  const downloadPdf = (name: string) => {
    setPdfLoadings(true);
    toCanvas(pdfRef.current)
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF("p", "mm", "a4", true);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        pdf.addImage(
          imgData,
          "PNG",
          imgX,
          imgY,
          imgWidth * ratio,
          imgHeight * ratio
        );
        pdf.save(`${name}.pdf`);
        setPdfLoadings(false);
      })
      .catch((err) => {
        setPdfLoadings(false);
        dispatch(
          showError({
            showAlert: true,
            description: "Failed to export PDF file. Please retry.",
            type: "error",
          })
        );
      });
  };
  /**
   * This callback is used to update the cookie
   * for displaying toast message for first time user
   */
  const checkAndNotifySync = useCallback(() => {
    const cookieName = clientCredsCookieName;
    const deserializedCookieValue = CookieHelpers.getCookie(cookieName);
    let serializedCookieValue = null;
    // will only update the cookie if found on the browser
    if (deserializedCookieValue) {
      serializedCookieValue = JSON.parse(deserializedCookieValue);
      if (serializedCookieValue) {
        if (!serializedCookieValue.isUserNotified) {
          dispatch(
            showError({
              showAlert: true,
              message: "",
              description: "Click the Sync button to view updated data.",
              type: "info",
            })
          );
          const cookieValue = JSON.stringify({
            licenseKey: serializedCookieValue?.licenseKey,
            isUserNotified: true,
          });
          try {
            CookieHelpers.setCookie(cookieName, cookieValue, 365 * 2); // 2yrs
          } catch (err) {
            console.log(err, "==Set Cookie==");
          }
        }
      }
    }
  }, [dispatch]);

  const authenticateUser = useCallback(async () => {
    try {
      if (parameters.installation.licenseKey) {
        const res = await saveOrValidateLicenseKey(
          parameters.installation.licenseKey,
          spaceId,
          client
        );
        if (res?.status === 200) {
          dispatch(setIsAuth(true));
        }
      }
    } catch (error: any) {
      switch (error?.response?.status) {
        case 200:
          break;
        case 404:
          dispatch(
            showError({
              showAlert: true,
              message: "License Key",
              description:
                error?.response?.data?.message ?? "License Key not found",
              type: "error",
            })
          );
          dispatch(setIsAuth(false));
          break;
        case 400:
          dispatch(
            showError({
              showAlert: true,
              message: "License Key",
              description:
                error?.response?.data?.message ??
                "License Key already exists with other space.",
              type: "error",
            })
          );
          dispatch(setIsAuth(false));
          break;

        default:
          dispatch(
            showError({
              showAlert: true,
              message: "License Key",
              description:
                error?.response?.data?.message ??
                "License Key validation failed.",
              type: "error",
            })
          );
          dispatch(setIsAuth(false));
          break;
      }
    }
  }, [client, dispatch, parameters.installation.licenseKey, spaceId]);

  useEffect(() => {
    if (authSlice?.isAuth) {
      checkAndNotifySync();
    }
  }, [checkAndNotifySync, authSlice?.isAuth]);

  return (
    <>
      <Header
        style={{ padding: 0, background: colorBgContainer }}
        className={`MainHeader ${themeSlice.theme}`}
      >
        <Button
          type="text"
          icon={
            collapsed
              ? parse(svgIcons.ArrowRightHeader)
              : parse(svgIcons.ArrowLeftHeader)
          }
          onClick={() => setCollapsed(!collapsed)}
          className="HeaderArrow"
          style={{
            fontSize: "16px",
            width: 50,
            height: 70,
          }}
        />
        <div className="HeaderTextUser">
          <div className="HeaderTextContent">
            {edit ? (
              <input
                value={navigationSlice?.activeRoute?.heading}
                onChange={handleHeading}
                type="text"
                autoFocus
                onBlur={() => setEdit(false)}
                maxLength={20}
              />
            ) : (
              <h2>{navigationSlice?.activeRoute?.heading}</h2>
            )}
            <button
              onClick={() => {
                setEdit(true);
                document.getElementById("heading")?.focus();
              }}
            >
              {" "}
              {parse(svgIcons.PenIcon)}{" "}
            </button>
          </div>

          <div className="HeaderUserInfo">
            <span
              className={`${
                themeSlice?.theme == "dark"
                  ? "dark-theme-text"
                  : "light-theme-text"
              }`}
            >
              Enable {themeSlice?.theme == "light" ? "Dark" : "Light"} Mode{" "}
            </span>
            <Switch
              checked={themeSlice.theme == "light" ? false : true}
              onChange={() =>
                dispatch(
                  themeChange(themeSlice.theme == "light" ? "dark" : "light")
                )
              }
            />
            <Button className="LogoutButton" onClick={() => dataSync()}>
              {parse(svgIcons.SyncIcon)} Sync
            </Button>
            <a
              href={`${process.env.NEXT_PUBLIC_CTF_MARKETING_WEBSITE_URL}/contact-us`}
              target="_blank"
              className="HelpButton"
            >
              {parse(svgIcons.HelpIcon)} <span>Help</span>
            </a>
          </div>
        </div>
      </Header>
      <CustomNotification />
      <Loader>
        <Content
          className={`MainContentRightBar ${themeSlice.theme}`}
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
          ref={pdfRef}
        >
          <div className="CustomerAcquisitionComponent">
            <div className="CompnayLogoInfo">
              <div className="CompanyLogoOuterCon">
                <Image
                  className="CompanyLogoImage"
                  layout="fill"
                  objectFit="contain"
                  src={companyLogoSrc}
                  onError={() => setCompanyLogoSrc("/images/CompanyLogo.svg")}
                  alt="Company logo"
                />{" "}
              </div>
              <span className="TagLineCompany">
                {companyName ? companyName : "Company Name"}
              </span>
            </div>
            <div className="RetatinDateCamp">
              <div className="DateData">
                <div className="DateOuterTop">
                  {/* <span className={`${themeSlice.theme}-dateText`}>Date</span>{" "} */}
                  <DatePicker />
                </div>
              </div>
              <Button
                className="LogoutButton"
                onClick={() =>
                  downloadPdf(navigationSlice?.activeRoute.heading)
                }
                loading={pdfLoading}
                type="primary"
              >
                {parse(svgIcons.ExportReportIcon)} Export Report
              </Button>
            </div>
          </div>
          <RenderSwitch order={navigationSlice?.activeRoute.order} />
        </Content>
      </Loader>
    </>
  );
}
