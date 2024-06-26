"use client";
import React, { useEffect, useMemo } from "react";
import { notification } from "antd";
import { useAppDispatch, useAppSelector } from "src/app/redux/hooks";
import { showError } from "src/app/redux/slices/notificationSlice";

const Context = React.createContext({ name: "Default" });
type NotificationType = "success" | "info" | "warning" | "error";

const CustomNotification: React.FC = () => {
  const [api, contextHolder] = notification.useNotification();
  const { notificationSlice,themeSlice } = useAppSelector((state) => state);


  useEffect(() => {
    if (notificationSlice.notifi.showAlert) {
      let type: NotificationType = notificationSlice.notifi.type as NotificationType;

      api[type]({
        className: `Noti-${type} ${themeSlice.theme}`,
        message: notificationSlice.notifi.message,
        description: notificationSlice.notifi.description,
        placement: "topRight",
        duration: 0,
        onClose() {
          closeAlert();
        },
      });
    }
  }, [notificationSlice.notifi.showAlert]);

  const contextValue = useMemo(() => ({ name: "Ant Design" }), []);

  const dispatch = useAppDispatch();

  const closeAlert = () => {
    dispatch(
      showError({
        showAlert: false,
        message: "",
        description: "",
        type: "",
      })
    );
  };

  return (
    <Context.Provider value={contextValue}>{contextHolder}</Context.Provider>
  );
};

export default CustomNotification;
