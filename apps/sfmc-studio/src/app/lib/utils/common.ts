import { AxiosInstance } from "axios";
import moment from "moment";

export const formatInput = (input: number, currencySign?: string) => {
  if (currencySign) {
    return `${currencySign}${
      Number(input)
        ?.toString()
        ?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") ?? "0"
    }`;
  }
  return (
    Number(input)
      ?.toString()
      ?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") ?? "0"
  );
};

export const defaultMenu = [
  {
    menulabel: "Customer Acquisition",
    heading: "Customer Acquisition",
    order: 1,
    link: "Customer_Acquistion",
  },
  {
    menulabel: "Customer Engagement",
    heading: "Customer Engagement",
    order: 2,
    link: "Customer_Engagement",
  },
  {
    menulabel: "Customer Retention",
    heading: "Customer Retention",
    order: 3,
    link: "Customer_Retention",
  },
  {
    menulabel: "ROI/Conversion",
    heading: "ROI/Conversion",
    order: 4,
    link: "ROI_Conversion",
  },
];

/**
 * This constant holds the value of default system TimeZone string
 */
export const defaultSystemTZ = "UTC"; //Intl.DateTimeFormat().resolvedOptions().timeZone;

export const clientCredsCookieName = "clientCreds";

export class CookieHelpers {
  static getCookie = (name: string) => {
    return (
      document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")?.pop() ||
      null
    );
  };

  static setCookie = (name: string, value: string, durationInDays: number) => {
    let expires = "";
    if (durationInDays) {
      const date = new Date();
      date.setTime(date.getTime() + durationInDays * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie =
      `${name}=` + (value || "") + expires + "; path=/; SameSite=None; Secure";
  };

  static deleteCookie = (name: string) => {
    document.cookie =
      name + "=; Max-Age=-99999999; path=/; SameSite=None; Secure";
  };
}

export const saveOrValidateLicenseKey = async (
  licenseKey: string,
  spaceId: string,
  client: AxiosInstance
) => {
  return client.post(`/api/auth/validate-license`, {
    licenseKey,
    spaceId,
  });
};

export const unlinkSpaceWithLicenseKey = async (
  spaceId: string,
  client: AxiosInstance
) => {
  return client.post("/api/auth/unlink-space", {
    spaceId,
  });
};

export const customDateRange = [
  "24 hours",
  "3 days",
  "7 days",
  "1 month",
  "3 month",
  "6 month",
  "Set Custom",
];

export const getDateRange = (rangeOption: string) => {
  let startDate: any, endDate: any;
  let todayEndDate = moment.utc().endOf("day").toDate();

  switch (rangeOption) {
    case "0":
      startDate = moment.utc().subtract(24, "hours").toDate();
      endDate = moment.utc().toDate();
      break;
    case "1":
      startDate = moment.utc().subtract(2, "days").startOf("day").toDate();
      endDate = todayEndDate;
      break;
    case "2":
      startDate = moment.utc().subtract(6, "days").startOf("day").toDate();
      endDate = todayEndDate;
      break;
    case "3":
      startDate = moment.utc().subtract(1, "month").startOf("day").toDate();
      endDate = todayEndDate;
      break;
    case "4":
      startDate = moment.utc().subtract(3, "months").startOf("day").toDate();
      endDate = todayEndDate;
      break;
    case "5":
      startDate = moment.utc().subtract(6, "months").startOf("day").toDate();
      endDate = todayEndDate;
      break;
    case "6":
      return false;
    default:
      // Handle invalid option
      break;
  }

  return {
    startDate: startDate,
    endDate: endDate,
  };
};

export const timeZoneMapping = [
  { name: "(UTC) Casablanca", iana: "Africa/Casablanca" },
  { name: "(UTC) Coordinated Universal Time", iana: "Etc/UTC" },
  { name: "(UTC) Dublin, Edinburgh, Lisbon, London", iana: "Europe/London" },
  { name: "(UTC) Monrovia, Reykjavik", iana: "Atlantic/Reykjavik" },
  {
    name: "(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna",
    iana: "Europe/Berlin",
  },
  {
    name: "(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague",
    iana: "Europe/Belgrade",
  },
  {
    name: "(UTC+01:00) Brussels, Copenhagen, Madrid, Paris",
    iana: "Europe/Brussels",
  },
  {
    name: "(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb",
    iana: "Europe/Sarajevo",
  },
  { name: "(UTC+01:00) West Central Africa", iana: "Africa/Lagos" },
  { name: "(UTC+01:00) Windhoek", iana: "Africa/Windhoek" },
  { name: "(UTC+02:00) Amman", iana: "Asia/Amman" },
  { name: "(UTC+02:00) Athens, Bucharest", iana: "Europe/Athens" },
  { name: "(UTC+02:00) Beirut", iana: "Asia/Beirut" },
  { name: "(UTC+02:00) Cairo", iana: "Africa/Cairo" },
  { name: "(UTC+02:00) Damascus", iana: "Asia/Damascus" },
  { name: "(UTC+02:00) Harare, Pretoria", iana: "Africa/Harare" },
  {
    name: "(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius",
    iana: "Europe/Helsinki",
  },
  { name: "(UTC+02:00) Istanbul", iana: "Europe/Istanbul" },
  { name: "(UTC+02:00) Jerusalem", iana: "Asia/Jerusalem" },
  { name: "(UTC+02:00) Nicosia", iana: "Asia/Nicosia" },
  { name: "(UTC+03:00) Baghdad", iana: "Asia/Baghdad" },
  { name: "(UTC+03:00) Kaliningrad, Minsk", iana: "Europe/Kaliningrad" },
  { name: "(UTC+03:00) Kuwait, Riyadh", iana: "Asia/Riyadh" },
  { name: "(UTC+03:00) Nairobi", iana: "Africa/Nairobi" },
  { name: "(UTC+03:30) Tehran", iana: "Asia/Tehran" },
  { name: "(UTC+04:00) Abu Dhabi, Muscat", iana: "Asia/Dubai" },
  { name: "(UTC+04:00) Baku", iana: "Asia/Baku" },
  {
    name: "(UTC+04:00) Moscow, St. Petersburg, Volgograd",
    iana: "Europe/Moscow",
  },
  { name: "(UTC+04:00) Port Louis", iana: "Indian/Mauritius" },
  { name: "(UTC+04:00) Tbilisi", iana: "Asia/Tbilisi" },
  { name: "(UTC+04:00) Yerevan", iana: "Asia/Yerevan" },
  { name: "(UTC+04:30) Kabul", iana: "Asia/Kabul" },
  { name: "(UTC+05:00) Islamabad, Karachi", iana: "Asia/Karachi" },
  { name: "(UTC+05:00) Tashkent", iana: "Asia/Tashkent" },
  {
    name: "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
    iana: "Asia/Kolkata",
  },
  { name: "(UTC+05:30) Sri Jayawardenepura", iana: "Asia/Colombo" },
  { name: "(UTC+05:45) Kathmandu", iana: "Asia/Kathmandu" },
  { name: "(UTC+06:00) Astana", iana: "Asia/Almaty" },
  { name: "(UTC+06:00) Dhaka", iana: "Asia/Dhaka" },
  { name: "(UTC+06:00) Ekaterinburg", iana: "Asia/Yekaterinburg" },
  { name: "(UTC+06:30) Yangon (Rangoon)", iana: "Asia/Yangon" },
  { name: "(UTC+07:00) Bangkok, Hanoi, Jakarta", iana: "Asia/Bangkok" },
  { name: "(UTC+07:00) Novosibirsk", iana: "Asia/Novosibirsk" },
  {
    name: "(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi",
    iana: "Asia/Shanghai",
  },
  { name: "(UTC+08:00) Krasnoyarsk", iana: "Asia/Krasnoyarsk" },
  { name: "(UTC+08:00) Kuala Lumpur, Singapore", iana: "Asia/Singapore" },
  { name: "(UTC+08:00) Perth", iana: "Australia/Perth" },
  { name: "(UTC+08:00) Taipei", iana: "Asia/Taipei" },
  { name: "(UTC+08:00) Ulaanbaatar", iana: "Asia/Ulaanbaatar" },
  { name: "(UTC+09:00) Irkutsk", iana: "Asia/Irkutsk" },
  { name: "(UTC+09:00) Osaka, Sapporo, Tokyo", iana: "Asia/Tokyo" },
  { name: "(UTC+09:00) Seoul", iana: "Asia/Seoul" },
  { name: "(UTC+09:30) Adelaide", iana: "Australia/Adelaide" },
  { name: "(UTC+09:30) Darwin", iana: "Australia/Darwin" },
  { name: "(UTC+10:00) Brisbane", iana: "Australia/Brisbane" },
  { name: "(UTC+10:00) Canberra, Melbourne, Sydney", iana: "Australia/Sydney" },
  { name: "(UTC+10:00) Guam, Port Moresby", iana: "Pacific/Port_Moresby" },
  { name: "(UTC+10:00) Hobart", iana: "Australia/Hobart" },
  { name: "(UTC+10:00) Yakutsk", iana: "Asia/Yakutsk" },
  {
    name: "(UTC+11:00) Solomon Is., New Caledonia",
    iana: "Pacific/Guadalcanal",
  },
  { name: "(UTC+11:00) Vladivostok", iana: "Asia/Vladivostok" },
  { name: "(UTC+12:00) Auckland, Wellington", iana: "Pacific/Auckland" },
  { name: "(UTC+12:00) Coordinated Universal Time+12", iana: "Etc/GMT-12" },
  { name: "(UTC+12:00) Fiji", iana: "Pacific/Fiji" },
  { name: "(UTC+12:00) Magadan", iana: "Asia/Magadan" },
  {
    name: "(UTC+12:00) Petropavlovsk-Kamchatsky - Old",
    iana: "Asia/Kamchatka",
  },
  { name: "(UTC+13:00) Nuku'alofa", iana: "Pacific/Tongatapu" },
  { name: "(UTC+13:00) Samoa", iana: "Pacific/Apia" },
  { name: "(UTC-01:00) Azores", iana: "Atlantic/Azores" },
  { name: "(UTC-01:00) Cape Verde Is.", iana: "Atlantic/Cape_Verde" },
  { name: "(UTC-02:00) Coordinated Universal Time-02", iana: "Etc/GMT+2" },
  { name: "(UTC-02:00) Mid-Atlantic", iana: "Etc/GMT+2" },
  { name: "(UTC-03:00) Brasilia", iana: "America/Sao_Paulo" },
  { name: "(UTC-03:00) Buenos Aires", iana: "America/Argentina/Buenos_Aires" },
  { name: "(UTC-03:00) Cayenne, Fortaleza", iana: "America/Cayenne" },
  { name: "(UTC-03:00) Greenland", iana: "America/Godthab" },
  { name: "(UTC-03:00) Montevideo", iana: "America/Montevideo" },
  { name: "(UTC-03:00) Salvador", iana: "America/Bahia" },
  { name: "(UTC-03:30) Newfoundland", iana: "America/St_Johns" },
  { name: "(UTC-04:00) Asuncion", iana: "America/Asuncion" },
  { name: "(UTC-04:00) Atlantic Time (Canada)", iana: "America/Halifax" },
  { name: "(UTC-04:00) Cuiaba", iana: "America/Cuiaba" },
  {
    name: "(UTC-04:00) Georgetown, La Paz, Manaus, San Juan",
    iana: "America/La_Paz",
  },
  { name: "(UTC-04:00) Santiago", iana: "America/Santiago" },
  { name: "(UTC-04:30) Caracas", iana: "America/Caracas" },
  { name: "(UTC-05:00) Bogota, Lima, Quito", iana: "America/Bogota" },
  { name: "(UTC-05:00) Eastern Time (US & Canada)", iana: "America/New_York" },
  { name: "(UTC-05:00) Indiana (East)", iana: "America/Indiana/Indianapolis" },
  { name: "(UTC-06:00) Central America", iana: "America/Guatemala" },
  { name: "(UTC-06:00) Central Time (US & Canada)", iana: "Etc/GMT+6" },
  {
    name: "(UTC-06:00) Guadalajara, Mexico City, Monterrey",
    iana: "America/Mexico_City",
  },
  { name: "(UTC-06:00) Saskatchewan", iana: "America/Regina" },
  { name: "(UTC-07:00) Arizona", iana: "America/Phoenix" },
  {
    name: "(UTC-07:00) Chihuahua, La Paz, Mazatlan",
    iana: "America/Chihuahua",
  },
  { name: "(UTC-07:00) Mountain Time (US & Canada)", iana: "America/Denver" },
  { name: "(UTC-08:00) Baja California", iana: "America/Tijuana" },
  {
    name: "(UTC-08:00) Pacific Time (US & Canada)",
    iana: "America/Los_Angeles",
  },
  { name: "(UTC-09:00) Alaska", iana: "America/Anchorage" },
  { name: "(UTC-10:00) Hawaii", iana: "Pacific/Honolulu" },
  { name: "(UTC-11:00) Coordinated Universal Time-11", iana: "Etc/GMT+11" },
  { name: "(UTC-12:00) International Date Line West", iana: "Etc/GMT+12" },
];
