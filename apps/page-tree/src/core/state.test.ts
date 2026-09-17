import { describe, expect, it } from "vitest";
import { computeStateFromSys } from "./state";

describe("computeStateFromSys", () => {
  it("returns draft when publishedVersion is missing", () => {
    // Arrange
    const sys = { version: 1 };

    // Act
    const result = computeStateFromSys(sys);

    // Assert
    expect(result).toBe("draft");
  });

  it("returns published when version equals publishedVersion + 1", () => {
    // Arrange
    const sys = { publishedVersion: 3, version: 4 };

    // Act
    const result = computeStateFromSys(sys);

    // Assert
    expect(result).toBe("published");
  });

  it("returns changed when version is greater than publishedVersion + 1", () => {
    // Arrange
    const sys = { publishedVersion: 3, version: 6 };

    // Act
    const result = computeStateFromSys(sys);

    // Assert
    expect(result).toBe("changed");
  });

  it("defaults to published when publishedVersion exists but version is missing", () => {
    // Arrange
    const sys = { publishedVersion: 3 };

    // Act
    const result = computeStateFromSys(sys);

    // Assert
    expect(result).toBe("published");
  });
});
