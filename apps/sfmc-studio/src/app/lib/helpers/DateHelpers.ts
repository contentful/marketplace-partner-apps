import moment from "moment-timezone";
import { Moment, tz } from "moment-timezone";
import { eDateFormats } from "../Constants";

/**
 * This is a utility wrapper function over the moment.js moment() function
 * @param date Datetime string (optional)
 * @param format string format for Datetime (optional)
 * @param convertToTZ timezone (IANA timezone) to which the date shall be converted into (optional)
 * @returns moment.Moment
 */
export const getMoment = (
  date?: string | Moment,
  convertToTZ?: string,
  format?: string
) => {
  let formattedMoment: Moment;
  if (date && format) {
    formattedMoment = moment(date, format, true);
  } else if (date) {
    formattedMoment = moment(date, undefined, true);
  } else {
    formattedMoment = moment();
  }
  if (convertToTZ) {
    formattedMoment = formattedMoment.tz(convertToTZ);
  }
  return formattedMoment;
};

export const defaultSalesCloudTZ =
  process.env?.DEFAULT_SALES_CLOUD_TZ || "America/New_York";
export const defaultMarketingCloudTZ =
  process.env?.DEFAULT_MARKETING_CLOUD_TZ || "Etc/GMT+6";

export const defaultDateRange = {
  startDate: moment().subtract(6, "days").toISOString(),
  endDate: moment().toISOString(),
};

export class DefaultTimeZones {
  static get salesCloud() {
    return defaultSalesCloudTZ;
  }

  static get marketingCloud() {
    return defaultMarketingCloudTZ;
  }
}

export const getTZOffset = (tz: string) => moment.utc().tz(tz).utcOffset();

/**
 * This class can be used to generate the
 * start and end date values for sync apis
 * on runtime
 */
export class DefaultSyncDates {
  static salesCloud(
    salesCloudObject: "contacts" | "others" = "others",
    tz: string = DefaultTimeZones.salesCloud
  ) {
    if (salesCloudObject === "contacts") {
      return {
        syncStartDate: moment()
          .tz(tz)
          .subtract(6, "months")
          .startOf("month")
          .startOf("day"),
        syncEndDate: moment().tz(tz).endOf("day"),
      };
    }
    return {
      syncStartDate: moment.utc().startOf("day").subtract(6, "months"),
      syncEndDate: moment.utc().endOf("day"),
    };
  }

  static marketingCloud(tz: string = DefaultTimeZones.marketingCloud) {
    return {
      syncStartDate: moment()
        .tz(tz)
        .subtract(6, "months")
        .startOf("day")
        .format("YYYY-MM-DD HH:mm:ss"),
      syncEndDate: moment().tz(tz).endOf("day").format("YYYY-MM-DD HH:mm:ss"),
    };
  }
}

/*** This is for stating and ending day */
export class DefaulApiDates {
  static get todayStartEndDate() {
    return {
      startDay: moment.utc().startOf("day").toDate(),
      endDay: moment.utc().endOf("day").toDate(),
    };
  }

  static get weeklyDate() {
    return {
      startDate: moment.utc().subtract(6, "days").toDate(),
      endDate: moment.utc().startOf("day").toDate(),
    };
  }
}
/*** */

/**
 * This method is used as helper to forcibly change the
 * tz of incoming ISO UTC datetimetz timestamp but
 * preserving the original datetime
 * @param utcDateTime
 * @param tz
 * @returns
 */
export const getLocalDateFromUTCDateTime = (
  utcDateTime: string,
  tz: string
) => {
  return moment.tz(
    moment(utcDateTime, eDateFormats.CONVERSION_FMT_DATE).format(
      eDateFormats.CONVERSION_FMT_DATE
    ),
    eDateFormats.CONVERSION_FMT_DATE,
    tz
  );
};
