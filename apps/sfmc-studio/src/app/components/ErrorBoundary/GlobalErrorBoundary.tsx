"use client";
import React from "react";
import Image from "next/image";
import style from "./GlobalErrorBoundary.module.scss";
function GlobalErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <div className={style.errorBoudryOuter}>
      <div className={style.errorBoudryInner}>
        <Image
          src="/images/error_boundry.svg"
          width="629"
          height="269"
          alt="error"
        />
        <h2>Something&apos;s Gone Wrong!</h2>
        <p>We&apos;re sorry for the inconvenience. Please try again later.</p>
        <button className={style.retryErrorButton} onClick={() => reset()}>
          {" "}
          Retry{" "}
        </button>
      </div>
    </div>
  );
}

export default GlobalErrorBoundary;
