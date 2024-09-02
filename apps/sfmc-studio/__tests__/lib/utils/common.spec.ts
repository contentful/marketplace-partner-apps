import {
  formatInput,
  defaultSystemTZ,
  clientCredsCookieName,
  CookieHelpers,
  getDateRange,
  encryptData,
  decryptClientData,
} from "@/lib/utils/common";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

jest.mock("axios");
dayjs.extend(utc);

const mockCipherParams = (encryptedData: string) => ({
  toString: () => encryptedData,
});

describe("Utility Functions", () => {
  test("formatInput formats number with currency sign", () => {
    expect(formatInput(1234567, "$")).toBe("$1,234,567");
  });

  test("formatInput formats number without currency sign", () => {
    expect(formatInput(1234567)).toBe("1,234,567");
  });

  test('defaultSystemTZ is "UTC"', () => {
    expect(defaultSystemTZ).toBe("UTC");
  });

  test('clientCredsCookieName is "clientCreds"', () => {
    expect(clientCredsCookieName).toBe("clientCreds");
  });

  describe("CookieHelpers", () => {
    beforeEach(() => {
      // Reset document.cookie before each test
      Object.defineProperty(document, "cookie", {
        writable: true,
        value: "",
      });
    });

    describe("getCookie", () => {
      it("should return the value of a specified cookie", () => {
        document.cookie = "testCookie=testValue";
        expect(CookieHelpers.getCookie("testCookie")).toBe("testValue");
      });

      it("should return null if the cookie does not exist", () => {
        expect(CookieHelpers.getCookie("nonExistentCookie")).toBeNull();
      });
    });

    describe("setCookie", () => {
      it("should set the cookie with the specified value and duration", () => {
        const name = "testCookie";
        const value = "testValue";
        const durationInDays = 7;
        const date = new Date();
        date.setTime(date.getTime() + durationInDays * 24 * 60 * 60 * 1000);
        const expires = `; expires=${date.toUTCString()}`;

        CookieHelpers.setCookie(name, value, durationInDays);
        expect(document.cookie).toBe(
          `${name}=${value}${expires}; path=/; SameSite=None; Secure`
        );
      });
    });

    describe("deleteCookie", () => {
      it("should delete the specified cookie", () => {
        document.cookie = "testCookie=testValue";
        CookieHelpers.deleteCookie("testCookie");
        expect(document.cookie).toBe(
          "testCookie=; Max-Age=-99999999; path=/; SameSite=None; Secure"
        );
      });
    });
  });

  test("encryptData encrypts data correctly", () => {
    const data = { key: "value" };
    const encrypted = encryptData(data);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
  });

  test("decryptClientData decrypts data correctly", () => {
    const data = { key: "value" };
    const encrypted = encryptData(data);
    const decrypted = decryptClientData(encrypted);
    expect(decrypted).toEqual(data);
  });

  test("decryptClientData handles errors", () => {
    expect(() => decryptClientData("invalid-encrypted-data")).toThrow(
      "unable to parse req"
    );
  });

  describe("getDateRange", () => {
    test('returns correct date range for "24 hours"', () => {
      const { startDate, endDate }: any = getDateRange("0");

      const now = dayjs.utc();
      const expectedStartDate = now.subtract(24, "hour").toDate();
      const expectedEndDate = now.toDate();

      expect(dayjs(startDate).isSame(expectedStartDate, "minute")).toBe(true);
      expect(dayjs(endDate).isSame(expectedEndDate, "minute")).toBe(true);
    });

    test('returns correct date range for "48 hours"', () => {
      const { startDate, endDate }: any = getDateRange("1");

      const now = dayjs.utc();
      const expectedStartDate = now.subtract(2, "day").startOf("day").toDate();
      const expectedEndDate = now.endOf("day").toDate();

      expect(dayjs(startDate).isSame(expectedStartDate, "minute")).toBe(true);
      expect(dayjs(endDate).isSame(expectedEndDate, "minute")).toBe(true);
    });

    test('returns correct date range for "7 days"', () => {
      const { startDate, endDate }: any = getDateRange("2");

      const now = dayjs.utc();
      const expectedStartDate = now.subtract(6, "day").startOf("day").toDate();
      const expectedEndDate = now.endOf("day").toDate();

      expect(dayjs(startDate).isSame(expectedStartDate, "minute")).toBe(true);
      expect(dayjs(endDate).isSame(expectedEndDate, "minute")).toBe(true);
    });

    test('returns correct date range for "1 month"', () => {
      const { startDate, endDate }: any = getDateRange("3");

      const now = dayjs.utc();
      const expectedStartDate = now
        .subtract(1, "month")
        .startOf("day")
        .toDate();
      const expectedEndDate = now.endOf("day").toDate();

      expect(dayjs(startDate).isSame(expectedStartDate, "minute")).toBe(true);
      expect(dayjs(endDate).isSame(expectedEndDate, "minute")).toBe(true);
    });

    test('returns correct date range for "3 months"', () => {
      const { startDate, endDate }: any = getDateRange("4");

      const now = dayjs.utc();
      const expectedStartDate = now
        .subtract(3, "months")
        .startOf("day")
        .toDate();
      const expectedEndDate = now.endOf("day").toDate();

      expect(dayjs(startDate).isSame(expectedStartDate, "minute")).toBe(true);
      expect(dayjs(endDate).isSame(expectedEndDate, "minute")).toBe(true);
    });

    test('returns correct date range for "6 months"', () => {
      const { startDate, endDate }: any = getDateRange("5");

      const now = dayjs.utc();
      const expectedStartDate = now
        .subtract(6, "months")
        .startOf("day")
        .toDate();
      const expectedEndDate = now.endOf("day").toDate();

      expect(dayjs(startDate).isSame(expectedStartDate, "minute")).toBe(true);
      expect(dayjs(endDate).isSame(expectedEndDate, "minute")).toBe(true);
    });

    test('returns false for "Set Custom"', () => {
      expect(getDateRange("6")).toBe(false);
    });
  });
});
