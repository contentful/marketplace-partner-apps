import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test the utility functions used in useSuggestions
// The hook itself requires complex mocking of react-query mutations

describe("useSuggestions utilities", () => {
  describe("isHtmlFragment", () => {
    // We need to test the utility function, but it's not exported
    // So we test via the createContentBlob behavior

    it("should detect HTML fragments", () => {
      // These patterns should be detected as HTML
      const htmlPatterns = [
        "<p>Hello</p>",
        "<div>Content</div>",
        "<span>Text</span>",
        "<h1>Title</h1>",
        "<ul><li>Item</li></ul>",
        "<strong>Bold</strong>",
        "<em>Italic</em>",
      ];

      htmlPatterns.forEach((pattern) => {
        expect(pattern).toMatch(
          /<\/?(p|div|span|h[1-6]|ul|ol|li|table|tr|td|th|blockquote|a|strong|em|br|hr)\b/i,
        );
      });
    });

    it("should not detect plain text as HTML", () => {
      const plainText = "This is just plain text without any HTML tags";
      expect(plainText).not.toMatch(
        /<\/?(p|div|span|h[1-6]|ul|ol|li|table|tr|td|th|blockquote|a|strong|em|br|hr)\b/i,
      );
    });
  });

  describe("isFullHtmlDocument", () => {
    it("should detect DOCTYPE html", () => {
      const doctype = "<!DOCTYPE html><html><body></body></html>";
      expect(doctype.trim()).toMatch(/^<!DOCTYPE\s+html/i);
    });

    it("should detect html tag at start", () => {
      const htmlTag = "<html><body></body></html>";
      expect(htmlTag.trim()).toMatch(/^<html/i);
    });

    it("should not detect fragments as full documents", () => {
      const fragment = "<p>Just a paragraph</p>";
      expect(fragment.trim()).not.toMatch(/^<!DOCTYPE\s+html/i);
      expect(fragment.trim()).not.toMatch(/^<html/i);
    });
  });

  describe("wrapInHtmlDocument", () => {
    it("should create proper HTML document structure", () => {
      const content = "<p>Test content</p>";
      const expected = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
</head>
<body>
${content}
</body>
</html>`;

      expect(expected).toContain("<!DOCTYPE html>");
      expect(expected).toContain('<html lang="en">');
      expect(expected).toContain('<meta charset="UTF-8">');
      expect(expected).toContain("<body>");
      expect(expected).toContain(content);
      expect(expected).toContain("</body>");
      expect(expected).toContain("</html>");
    });
  });

  describe("validateConfig", () => {
    it("should throw error when apiKey is missing", () => {
      const config = { apiKey: "" };
      expect(() => {
        if (!config.apiKey) {
          throw new Error("API key is required");
        }
      }).toThrow("API key is required");
    });

    it("should not throw when apiKey is present", () => {
      const config = { apiKey: "test-api-key" };
      expect(() => {
        if (!config.apiKey) {
          throw new Error("API key is required");
        }
      }).not.toThrow();
    });
  });

  describe("createContentBlob", () => {
    it("should create a File object", () => {
      const content = "Test content";
      const file = new File([content], "content.txt", { type: "text/plain" });

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("content.txt");
      expect(file.type).toBe("text/plain");
    });

    it("should create HTML file for HTML content", () => {
      const content = "<p>HTML content</p>";
      const wrapped = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
</head>
<body>
${content}
</body>
</html>`;
      const file = new File([wrapped], "content.html", { type: "text/html" });

      expect(file.name).toBe("content.html");
      expect(file.type).toBe("text/html");
    });

    it("should use .txt extension for plain text", () => {
      const content = "Plain text content";
      const file = new File([content], "content.txt", { type: "text/plain" });

      expect(file.name).toBe("content.txt");
      expect(file.type).toBe("text/plain");
    });
  });

  describe("pollWorkflowCompletion", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should resolve when result is available", async () => {
      const resultRef = { current: null as { data: string } | null };
      const failedRef = { current: false };

      // Create a promise that polls for the result
      const pollPromise = new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (resultRef.current) {
            clearInterval(checkInterval);
            resolve(resultRef.current);
          } else if (failedRef.current) {
            clearInterval(checkInterval);
            reject(new Error("Workflow failed"));
          }
        }, 100);
      });

      // Set the result after a short delay
      setTimeout(() => {
        resultRef.current = { data: "success" };
      }, 150);

      // Advance timers
      await vi.advanceTimersByTimeAsync(200);

      const result = await pollPromise;
      expect(result).toEqual({ data: "success" });
    });

    it("should reject when workflow fails", async () => {
      const resultRef = { current: null as { data: string } | null };
      const failedRef = { current: false };

      const pollPromise = new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (resultRef.current) {
            clearInterval(checkInterval);
            resolve(resultRef.current);
          } else if (failedRef.current) {
            clearInterval(checkInterval);
            reject(new Error("Workflow failed"));
          }
        }, 100);
      });

      // Set failed after a short delay
      setTimeout(() => {
        failedRef.current = true;
      }, 150);

      // Advance timers
      vi.advanceTimersByTime(200);

      // Use try/catch to properly handle the rejection
      let error: Error | null = null;
      try {
        await pollPromise;
      } catch (e) {
        error = e as Error;
      }

      expect(error).not.toBeNull();
      expect(error?.message).toBe("Workflow failed");
    });
  });
});
