import { describe, it, expect } from "vitest";
import {
  isHtmlFragment,
  isFullHtmlDocument,
  wrapInHtmlDocument,
  createContentBlob,
} from "./htmlUtils";

describe("htmlUtils", () => {
  describe("isHtmlFragment", () => {
    it("should detect HTML fragments", () => {
      expect(isHtmlFragment("<p>Hello</p>")).toBe(true);
      expect(isHtmlFragment("<div>Content</div>")).toBe(true);
      expect(isHtmlFragment("<span>Text</span>")).toBe(true);
      expect(isHtmlFragment("<h1>Title</h1>")).toBe(true);
      expect(isHtmlFragment("<ul><li>Item</li></ul>")).toBe(true);
      expect(isHtmlFragment("<strong>Bold</strong>")).toBe(true);
      expect(isHtmlFragment("<em>Italic</em>")).toBe(true);
      expect(isHtmlFragment("<blockquote>Quote</blockquote>")).toBe(true);
      expect(isHtmlFragment("<a href='#'>Link</a>")).toBe(true);
      expect(isHtmlFragment("<br>")).toBe(true);
      expect(isHtmlFragment("<hr>")).toBe(true);
    });

    it("should not detect plain text as HTML", () => {
      expect(isHtmlFragment("This is just plain text")).toBe(false);
      expect(isHtmlFragment("No HTML tags here")).toBe(false);
      expect(isHtmlFragment("Just some text with < and > characters")).toBe(false);
    });

    it("should return false for full HTML documents", () => {
      expect(isHtmlFragment("<!DOCTYPE html><html><body></body></html>")).toBe(false);
      expect(isHtmlFragment("<html><body></body></html>")).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(isHtmlFragment("  <p>Hello</p>  ")).toBe(true);
      expect(isHtmlFragment("\n<div>Content</div>\n")).toBe(true);
    });
  });

  describe("isFullHtmlDocument", () => {
    it("should detect DOCTYPE html", () => {
      expect(isFullHtmlDocument("<!DOCTYPE html><html><body></body></html>")).toBe(true);
      expect(isFullHtmlDocument("<!doctype html><html><body></body></html>")).toBe(true);
    });

    it("should detect html tag at start", () => {
      expect(isFullHtmlDocument("<html><body></body></html>")).toBe(true);
      expect(isFullHtmlDocument("<HTML><body></body></HTML>")).toBe(true);
    });

    it("should not detect fragments as full documents", () => {
      expect(isFullHtmlDocument("<p>Just a paragraph</p>")).toBe(false);
      expect(isFullHtmlDocument("<div>Content</div>")).toBe(false);
    });

    it("should handle whitespace", () => {
      expect(isFullHtmlDocument("  <!DOCTYPE html><html></html>  ")).toBe(true);
      expect(isFullHtmlDocument("\n<html></html>\n")).toBe(true);
    });
  });

  describe("wrapInHtmlDocument", () => {
    it("should create proper HTML document structure", () => {
      const content = "<p>Test content</p>";
      const result = wrapInHtmlDocument(content);

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain("<head>");
      expect(result).toContain("</head>");
      expect(result).toContain("<body>");
      expect(result).toContain(content);
      expect(result).toContain("</body>");
      expect(result).toContain("</html>");
    });

    it("should preserve content exactly", () => {
      const content = "<div><p>Nested content</p></div>";
      const result = wrapInHtmlDocument(content);
      expect(result).toContain(content);
    });
  });

  describe("createContentBlob", () => {
    it("should create text file for plain text", () => {
      const blob = createContentBlob("Plain text content");
      expect(blob.name).toBe("content.txt");
      expect(blob.type).toBe("text/plain");
    });

    it("should create HTML file for HTML fragments", () => {
      const blob = createContentBlob("<p>HTML content</p>");
      expect(blob.name).toBe("content.html");
      expect(blob.type).toBe("text/html");
    });

    it("should create HTML file when isHtml flag is true", () => {
      const blob = createContentBlob("Some content", true);
      expect(blob.name).toBe("content.html");
      expect(blob.type).toBe("text/html");
    });

    it("should create HTML file for full HTML documents", () => {
      const blob = createContentBlob("<!DOCTYPE html><html><body></body></html>");
      expect(blob.name).toBe("content.html");
      expect(blob.type).toBe("text/html");
    });

    it("should wrap HTML fragments in document structure", () => {
      // We can't easily test the blob content in jsdom,
      // but we can verify it creates an HTML file
      const blob = createContentBlob("<p>Fragment</p>");
      expect(blob.name).toBe("content.html");
      expect(blob.type).toBe("text/html");
      // The blob size should be larger than the input due to wrapping
      expect(blob.size).toBeGreaterThan("<p>Fragment</p>".length);
    });

    it("should handle full HTML documents without double-wrapping", () => {
      const fullDoc = "<!DOCTYPE html><html><body>Content</body></html>";
      const blob = createContentBlob(fullDoc);
      expect(blob.name).toBe("content.html");
      expect(blob.type).toBe("text/html");
      // Size should be approximately equal since no wrapping occurs
      expect(blob.size).toBe(fullDoc.length);
    });
  });
});
