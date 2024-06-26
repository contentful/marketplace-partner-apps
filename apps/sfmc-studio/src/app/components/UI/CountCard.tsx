import React, { useMemo } from "react";
import style from "./countCard.module.scss";
import parse from "html-react-parser";
import svgIcons from "@/lib/utils/icons";
import { formatInput } from "@/lib/utils/common";
import { Tooltip } from "antd";
import { useAppSelector } from "src/app/redux/hooks";

function CountCard({
  cardText,
  countData,
  currencySign,
  icon,
  toolTipText,
}: {
  cardText: string;
  countData: { count: number; change: number };
  currencySign?: string;
  icon: string;
  toolTipText?: string;
}) {
  let { TooltipIcon } = svgIcons;
  const theme: string = useAppSelector((state) => state.themeSlice.theme);
  const isPositiveChange = useMemo(
    () => Number(countData?.change) >= 0,
    [countData?.change]
  );

  return (
    <div className={`${style.CountCardMain} DataDark`}>
      <p className={style.CountTitleIcon}>
        <span className="CountIcon">{parse(icon)}</span>
        <span className={theme}>{cardText}</span>
        <Tooltip title={toolTipText}  overlayClassName={theme}>
          <div className="ToolTipDark">{parse(TooltipIcon)}</div>
        </Tooltip>
      </p>
      <div className={style.CountContInnLR}>
        <div className={style.CountCardInnerLeft}>
          <h3>
            <Tooltip title={formatInput(countData?.count, currencySign)}  overlayClassName={theme}>
              {formatInput(countData?.count, currencySign)}
            </Tooltip>
          </h3>
        </div>
        <div className={style.CountCardInnerRight}>
          <div
            className={`${isPositiveChange ? style.Positive : style.Negative} ${
              isPositiveChange ? "PositiveDark" : "NagativeDark"
            }`}
          >
            <span>
              {isPositiveChange ? "+" : ""}
              {formatInput(countData?.change)}%{" "}
            </span>
            {isPositiveChange ? (
              <>{parse(svgIcons.RoiIcon)}</>
            ) : (
              <>{parse(svgIcons.RoiDescIcon)}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CountCard;
