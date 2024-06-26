"use client";
import React from "react";
import { Spin } from "antd";
import { useAppSelector } from "src/app/redux/hooks";

const Loader = ({ children }: { children: React.ReactNode }) => {
  const loading = useAppSelector((state) => state.loaderSlice.loading);
  return <Spin spinning={loading}>{children}</Spin>;
};

export default Loader;
