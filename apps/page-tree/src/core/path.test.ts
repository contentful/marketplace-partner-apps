import { describe, expect, it } from "vitest";
import {
  buildPath,
  buildPreviewUrl,
  isUnderRoot,
  joinBaseUrl,
  lastSegment,
  normalizePath,
  normalizeRoutePrefix,
} from "./path";

describe("normalizePath", () => {
  it("returns empty string for empty input", () => {
    // Arrange
    const input = "   ";

    // Act
    const result = normalizePath(input);

    // Assert
    expect(result).toBe("");
  });

  it("preserves root '/'", () => {
    // Arrange
    const input1 = "/";
    const input2 = "////";

    // Act
    const result1 = normalizePath(input1);
    const result2 = normalizePath(input2);

    // Assert
    expect(result1).toBe("/");
    expect(result2).toBe("/");
  });

  it("adds leading slash and removes trailing slash", () => {
    // Arrange
    const input = "news/foo/";

    // Act
    const result = normalizePath(input);

    // Assert
    expect(result).toBe("/news/foo");
  });

  it("collapses multiple slashes", () => {
    // Arrange
    const input = "//news///foo";

    // Act
    const result = normalizePath(input);

    // Assert
    expect(result).toBe("/news/foo");
  });
});

describe("lastSegment", () => {
  it("returns last segment for nested path", () => {
    // Arrange
    const input = "/news/women-in-engineering";

    // Act
    const result = lastSegment(input);

    // Assert
    expect(result).toBe("women-in-engineering");
  });

  it("returns '/' for root", () => {
    // Arrange
    const input = "/";

    // Act
    const result = lastSegment(input);

    // Assert
    expect(result).toBe("/");
  });
});

describe("isUnderRoot", () => {
  it("returns true when root is empty", () => {
    // Arrange
    const path = "/a/b";
    const root = "";

    // Act
    const result = isUnderRoot(path, root);

    // Assert
    expect(result).toBe(true);
  });

  it("returns true when root is '/'", () => {
    // Arrange
    const path = "/a/b";
    const root = "/";

    // Act
    const result = isUnderRoot(path, root);

    // Assert
    expect(result).toBe(true);
  });

  it("returns true for root match and descendant match", () => {
    // Arrange
    const root = "/news";
    const exact = "/news";
    const descendant = "/news/a";

    // Act
    const exactResult = isUnderRoot(exact, root);
    const descendantResult = isUnderRoot(descendant, root);

    // Assert
    expect(exactResult).toBe(true);
    expect(descendantResult).toBe(true);
  });

  it("returns false for prefix collision", () => {
    // Arrange
    const root = "/news";
    const other = "/newspaper/a";

    // Act
    const result = isUnderRoot(other, root);

    // Assert
    expect(result).toBe(false);
  });
});

describe("joinBaseUrl", () => {
  it("joins baseUrl and path without double slashes", () => {
    // Arrange
    const baseUrl = "https://example.com/";
    const path = "/news/a";

    // Act
    const result = joinBaseUrl(baseUrl, path);

    // Assert
    expect(result).toBe("https://example.com/news/a");
  });

  it("handles root path", () => {
    // Arrange
    const baseUrl = "https://example.com";
    const path = "/";

    // Act
    const result = joinBaseUrl(baseUrl, path);

    // Assert
    expect(result).toBe("https://example.com/");
  });

  it("degrades gracefully when baseUrl is empty", () => {
    // Arrange
    const baseUrl = "";
    const path = "/news/a";

    // Act
    const result = joinBaseUrl(baseUrl, path);

    // Assert
    expect(result).toBe("/news/a");
  });
});

describe("normalizeRoutePrefix", () => {
  it("returns empty string for empty or '/'", () => {
    // Arrange
    const a = "";
    const b = "/";
    const c = "   ";

    // Act
    const ra = normalizeRoutePrefix(a);
    const rb = normalizeRoutePrefix(b);
    const rc = normalizeRoutePrefix(c);

    // Assert
    expect(ra).toBe("");
    expect(rb).toBe("");
    expect(rc).toBe("");
  });

  it("ensures leading slash and strips trailing slash", () => {
    // Arrange
    const a = "news/";
    const b = "/news/";
    const c = "/news";

    // Act
    const ra = normalizeRoutePrefix(a);
    const rb = normalizeRoutePrefix(b);
    const rc = normalizeRoutePrefix(c);

    // Assert
    expect(ra).toBe("/news");
    expect(rb).toBe("/news");
    expect(rc).toBe("/news");
  });

  it("collapses multiple slashes", () => {
    // Arrange
    const input = "///news///";

    // Act
    const result = normalizeRoutePrefix(input);

    // Assert
    expect(result).toBe("/news");
  });
});

describe("buildPath", () => {
  it("builds path from prefix and relative slug", () => {
    // Arrange
    const prefix = "/news";
    const slug = "women-in-engineering";

    // Act
    const result = buildPath(prefix, slug);

    // Assert
    expect(result).toBe("/news/women-in-engineering");
  });

  it("treats slugOrPath starting with '/' as absolute override", () => {
    // Arrange
    const prefix = "/news";
    const absolute = "/events/summer-jam";

    // Act
    const result = buildPath(prefix, absolute);

    // Assert
    expect(result).toBe("/events/summer-jam");
  });

  it("handles empty prefix (root)", () => {
    // Arrange
    const prefix = "";
    const slug = "about";

    // Act
    const result = buildPath(prefix, slug);

    // Assert
    expect(result).toBe("/about");
  });

  it("returns empty string when slugOrPath is empty", () => {
    // Arrange
    const prefix = "/news";
    const slug = "   ";

    // Act
    const result = buildPath(prefix, slug);

    // Assert
    expect(result).toBe("");
  });
});

describe("buildPreviewUrl", () => {
  it("joins baseUrl + builtPath", () => {
    // Arrange
    const baseUrl = "https://example.com/";
    const prefix = "/news";
    const slug = "a";

    // Act
    const result = buildPreviewUrl(baseUrl, prefix, slug);

    // Assert
    expect(result).toBe("https://example.com/news/a");
  });

  it("returns site path when baseUrl is empty", () => {
    // Arrange
    const baseUrl = "";
    const prefix = "/news";
    const slug = "a";

    // Act
    const result = buildPreviewUrl(baseUrl, prefix, slug);

    // Assert
    expect(result).toBe("/news/a");
  });

  it("handles absolute override paths", () => {
    // Arrange
    const baseUrl = "https://example.com";
    const prefix = "/news";
    const absolute = "/events/x";

    // Act
    const result = buildPreviewUrl(baseUrl, prefix, absolute);

    // Assert
    expect(result).toBe("https://example.com/events/x");
  });
});
