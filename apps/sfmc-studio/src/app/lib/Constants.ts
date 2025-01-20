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

export const environment: any = {
  NEXT_PUBLIC_ENABLE_GTM: true,
  NEXT_PUBLIC_GTM_ID: "GTM-5Q4M3FWD",
  NEXT_PUBLIC_CTF_MARKETING_WEBSITE_URL: "https://sfmcstudio.com",
  NEXT_PUBLIC_API_ENDPOINT: "https://contentful.manageabl.com",
  NEXT_PUBLIC_ENCRYPTION_DATA: "wsrwn231342nee",
  NEXT_PUBLIC_JWT_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MjEyOTE1ODJ9.sR2QvoAT3RIk1ktCP3HabDMmf-nkalaDo8JJOvyLxu4'
}