import { describe, it, expect } from "vitest";

import { getRandomInt } from "../randomInt";

describe("getRandomInt", () => {
  it("returns a value within the expected range", () => {
    const max = 10;
    for (let i = 0; i < 100; i++) {
      const value = getRandomInt(max);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(max);
    }
  });
});
