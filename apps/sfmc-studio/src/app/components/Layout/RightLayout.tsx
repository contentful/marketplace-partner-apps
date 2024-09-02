"use client";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { Layout, Button, theme } from "antd";
const { Header, Content } = Layout;
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
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
import CustomNotification from "../UI/CustomNotification";
import Loader from "../Loader/Loader";
import { addMenuArr, changeRoute } from "@/redux/slices/navigationSlice";
import debounce from "lodash/debounce";
import jsPDF from "jspdf";
import { toCanvas } from "html-to-image";
import { themeChange } from "@/redux/slices/themeSlice";
import { Switch } from "antd";
import {
  clientCredsCookieName,
  CookieHelpers,
  decryptClientData,
  encryptData,
  saveOrValidateLicenseKey,
} from "@/lib/utils/common";
import { setIsAuth } from "./../../redux/slices/authSlice";
import { openNotification } from "@/lib/utils/dashboards";

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
  const [disabled, setDisabled] = useState<boolean>(false);

  useEffect(() => {
    getUserConfig();
  }, []);

  const getUserConfig = async () => {
    try {
      if (parameters?.installation?.licenseKey) {
        const automationSyncStatus = await client.post(
          "/api/user-config/get-config",
          {
            licenseKey: encryptData({
              licenseKey: parameters?.installation?.licenseKey,
            }),
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
              ["jro34134ecr4aex"]: `${encryptData({
                validate: Date.now(),
                token: process.env.NEXT_PUBLIC_JWT_TOKEN,
              })}`,
            },
          }
        );

        if (automationSyncStatus?.data?.data) {
          let { automatedSync } = automationSyncStatus?.data?.data;
          if (automatedSync) {
            openNotification({
              message: "Auto-sync activated. Enjoy seamless data updates now.",
              type: "success",
              theme: themeSlice.theme,
            });
          } else if (!automatedSync) {
            openNotification({
              message:
                "Auto-sync disabled. Activate for continues data updates.",
              type: "error",
              theme: themeSlice.theme,
            });
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const dataSync = async () => {
    try {
      if (parameters?.installation?.licenseKey && authSlice?.isAuth) {
        setDisabled(true);
        const salesSync = await client.post(
          "/api/sync/sales-data",
          {
            baseUrl:
              parameters?.installation?.[
                AppInstallationParametersKeys.SFSC_URL
              ],
            username:
              parameters?.installation?.[
                AppInstallationParametersKeys.SFSC_USERNAME
              ],
            password: encryptData({
              sfscPassword:
                parameters?.installation?.[
                  AppInstallationParametersKeys.SFSC_PASSWORD
                ],
            }),
            clientId:
              parameters?.installation?.[
                AppInstallationParametersKeys.SFSC_CLIENT_ID
              ],
            clientSecret: encryptData({
              sfscclientSecret:
                parameters?.installation?.[
                  AppInstallationParametersKeys.SFSC_CLIENT_SECRET
                ],
            }),
            licenseKey: encryptData({
              licenseKey:
                parameters?.installation?.[
                  AppInstallationParametersKeys.LICENSE_KEY
                ],
            }),
            sfscTimezone:
              parameters?.installation?.[
                AppInstallationParametersKeys.SFSC_TIMEZONE
              ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
              ["jro34134ecr4aex"]: `${encryptData({
                validate: Date.now(),
                token: process.env.NEXT_PUBLIC_JWT_TOKEN,
              })}`,
            },
          }
        );

        if (salesSync.status !== 200) {
          throw new Error("Sales data sync failed");
        }
        if (salesSync.status == 200) {
          openNotification({
            message: "Success",
            description:
              "Sync triggered successfully for sales cloud. Data should be updated in a few mins",
            type: "success",
            theme: themeSlice.theme,
          });
          setDisabled(false);
        }
      }
    } catch (err: any) {
      setDisabled(false);
      openNotification({
        message: "Failure",
        description: "Please verify configuration details for sales cloud.",
        type: "error",
        theme: themeSlice.theme,
      });
    }

    try {
      if (parameters?.installation?.licenseKey && authSlice?.isAuth) {
        setDisabled(true);
        const marketingSync = await client.post(
          "/api/sync/marketing-data",
          {
            licenseKey: encryptData({
              licenseKey:
                parameters?.installation?.[
                  AppInstallationParametersKeys.LICENSE_KEY
                ],
            }),
            sfmcSubdomain:
              parameters?.installation?.[
                AppInstallationParametersKeys.SFMC_DOMAIN
              ],
            sfmcclientId:
              parameters?.installation?.[
                AppInstallationParametersKeys.SFMC_CLIENT_ID
              ],
            sfmcclientSecret: encryptData({
              sfmcclientSecret:
                parameters?.installation?.[
                  AppInstallationParametersKeys.SFMC_CLIENT_SECRET
                ],
            }),
            sfmcTimezone:
              parameters?.installation?.[
                AppInstallationParametersKeys.SFMC_TIMEZONE
              ],
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_JWT_TOKEN}`,
              ["jro34134ecr4aex"]: `${encryptData({
                validate: Date.now(),
                token: process.env.NEXT_PUBLIC_JWT_TOKEN,
              })}`,
            },
          }
        );

        if (marketingSync.status !== 200) {
          throw new Error("Marketing data sync failed");
        }

        if (marketingSync.status == 200) {
          openNotification({
            message: "Success",
            description:
              "Sync triggered successfully for marketing cloud. Data should be updated in a few mins",
            type: "success",
            theme: themeSlice.theme,
          });
          setDisabled(false);
        }
      }
    } catch (err: any) {
      setDisabled(false);
      openNotification({
        message: "Failure",
        description: "Please verify configuration details for marketing cloud.",
        type: "error",
        theme: themeSlice.theme,
      });
    }
  };

  const updatingHeading = async (e: any) => {
    e.preventDefault();

    const res = await client.post(
      "/api/dashboard/dashboard-config/update-menu",
      {
        licenseKey: encryptData({
          licenseKey: parameters.installation.licenseKey,
        }),
        heading: e.target.value,
        _id: navigationSlice?.activeRoute._id,
        menulable: e.target.value,
      }
    );
    if (res.status === 200) {
      const list = await client.post(
        "/api/dashboard/dashboard-config/get-menu",
        {
          licenseKey: encryptData({
            licenseKey: parameters.installation.licenseKey,
          }),
        }
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
        openNotification({
          message: "",
          description: "Failed to export PDF file. Please retry.",
          type: "error",
          theme: themeSlice.theme,
        });
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

      try{
        serializedCookieValue = decryptClientData(deserializedCookieValue)
      }catch(error) {
       serializedCookieValue=JSON.parse(JSON.stringify(deserializedCookieValue))
      }

      if (serializedCookieValue) {
        if (!serializedCookieValue.isUserNotified) {
          openNotification({
            message: "",
            description: "Click the Sync button to view updated data.",
            type: "info",
            theme: themeSlice.theme,
          });

          const cookieValue = encryptData({
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

  useEffect(() => {
    if (authSlice?.isAuth) checkAndNotifySync();
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
            <Button
              disabled={disabled}
              className="LogoutButton"
              onClick={() => dataSync()}
            >
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
