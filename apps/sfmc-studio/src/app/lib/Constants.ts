export enum eDataExtensionKey {
  DELIVERIES = "deliveries",
  OPENS = "opens",
  CLICKS = "clicks",
  UNIQUE_CLICKS = "uniqueClicks",
  UNIQUE_OPENS = "uniqueOpens",
  BOUNCES = "bounces",
  UNSUBSCRIBERS = "unsubscribers",
}

export const Weekdays = {
  "1": "Sunday",
  "2": "Monday",
  "3": "Tuesday",
  "4": "Wednesday",
  "5": "Thursday",
  "6": "Friday",
  "7": "Saturday",
};

export const protectedRoutes: string[] = ["dashboard", "sync", "clearCache"];

export enum themeTextColor {
  dark = "white",
  light = "#111B2B",
}
