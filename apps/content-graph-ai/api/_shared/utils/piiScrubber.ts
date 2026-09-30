/**
 * PII Scrubbing Utility
 * Removes personally identifiable information before sending content to external APIs
 */

export interface PIIScrubbingResult {
  scrubbedContent: string;
  piiDetected: boolean;
  redactedTypes: string[];
  originalLength: number;
  scrubbedLength: number;
}

export class PIIScrubber {
  // Create fresh regex instances to avoid statefulness issues with global regexes
  private static createEmailRegex = () =>
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  private static createPhoneRegex = () =>
    /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
  private static createCreditCardRegex = () => /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  private static createSSNRegex = () => /\b\d{3}-?\d{2}-?\d{4}\b/g;
  private static createIPRegex = () => /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  private static createURLWithParamsRegex = () =>
    /https?:\/\/[^\s]+\?[^\s]*(?:email|user|id|token|key)[^\s]*/gi;
  private static createUUIDRegex = () =>
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
  private static createNumericIDRegex = () =>
    /\b(?:id|user|customer|account)[:=]\s*\d{6,}\b/gi;
  private static createAddressRegex = () =>
    /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|way|court|ct|place|pl)\.?\b/gi;

  /**
   * Main scrubbing method that removes all detected PII
   */
  public static scrubContent(content: string): PIIScrubbingResult {
    if (!content || typeof content !== "string") {
      return {
        scrubbedContent: content || "",
        piiDetected: false,
        redactedTypes: [],
        originalLength: 0,
        scrubbedLength: 0,
      };
    }

    let scrubbedContent = content;
    const redactedTypes: string[] = [];
    const originalLength = content.length;

    // Email redaction
    const emailRegex = this.createEmailRegex();
    if (emailRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createEmailRegex(),
        "[EMAIL_REDACTED]",
      );
      redactedTypes.push("email");
    }

    // Phone number redaction
    const phoneRegex = this.createPhoneRegex();
    if (phoneRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createPhoneRegex(),
        "[PHONE_REDACTED]",
      );
      redactedTypes.push("phone");
    }

    // Credit card redaction
    const creditCardRegex = this.createCreditCardRegex();
    if (creditCardRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createCreditCardRegex(),
        "[CREDIT_CARD_REDACTED]",
      );
      redactedTypes.push("credit_card");
    }

    // SSN redaction
    const ssnRegex = this.createSSNRegex();
    if (ssnRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createSSNRegex(),
        "[SSN_REDACTED]",
      );
      redactedTypes.push("ssn");
    }

    // IP address redaction
    const ipRegex = this.createIPRegex();
    if (ipRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createIPRegex(),
        "[IP_REDACTED]",
      );
      redactedTypes.push("ip_address");
    }

    // URL with parameters redaction
    const urlRegex = this.createURLWithParamsRegex();
    if (urlRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createURLWithParamsRegex(),
        "[URL_WITH_PARAMS_REDACTED]",
      );
      redactedTypes.push("url_with_params");
    }

    // UUID redaction
    const uuidRegex = this.createUUIDRegex();
    if (uuidRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createUUIDRegex(),
        "[UUID_REDACTED]",
      );
      redactedTypes.push("uuid");
    }

    // Numeric ID redaction
    const numericIdRegex = this.createNumericIDRegex();
    if (numericIdRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createNumericIDRegex(),
        "[NUMERIC_ID_REDACTED]",
      );
      redactedTypes.push("numeric_id");
    }

    // Address redaction
    const addressRegex = this.createAddressRegex();
    if (addressRegex.test(scrubbedContent)) {
      scrubbedContent = scrubbedContent.replace(
        this.createAddressRegex(),
        "[ADDRESS_REDACTED]",
      );
      redactedTypes.push("address");
    }

    // Additional conservative redaction for potential PII patterns
    // Remove patterns that look like account numbers or sensitive identifiers
    const CONSERVATIVE_PATTERNS = [
      /\b(?:account|acct|customer|client|member)[\s#:-]*\d{5,}\b/gi,
      /\b(?:license|permit|policy)[\s#:-]*[a-z0-9]{6,}\b/gi,
    ];

    CONSERVATIVE_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(scrubbedContent)) {
        scrubbedContent = scrubbedContent.replace(
          pattern,
          `[SENSITIVE_ID_${index}_REDACTED]`,
        );
        redactedTypes.push(`sensitive_id_${index}`);
      }
    });

    const piiDetected = redactedTypes.length > 0;
    const scrubbedLength = scrubbedContent.length;

    return {
      scrubbedContent,
      piiDetected,
      redactedTypes,
      originalLength,
      scrubbedLength,
    };
  }

  /**
   * Validates that content has been properly scrubbed - checks ALL PII types
   */
  public static validateScrubbing(content: string): boolean {
    if (!content) return true;

    // Comprehensive validation - ensure NO PII remains using fresh regex instances
    const hasEmail = this.createEmailRegex().test(content);
    const hasPhone = this.createPhoneRegex().test(content);
    const hasSSN = this.createSSNRegex().test(content);
    const hasCreditCard = this.createCreditCardRegex().test(content);
    const hasIP = this.createIPRegex().test(content);
    const hasURL = this.createURLWithParamsRegex().test(content);
    const hasUUID = this.createUUIDRegex().test(content);
    const hasNumericID = this.createNumericIDRegex().test(content);
    const hasAddress = this.createAddressRegex().test(content);

    // Check conservative patterns
    const conservativePatterns = [
      /\b(?:account|acct|customer|client|member)[\s#:-]*\d{5,}\b/gi,
      /\b(?:license|permit|policy)[\s#:-]*[a-z0-9]{6,}\b/gi,
    ];

    const hasConservativePII = conservativePatterns.some((pattern) =>
      pattern.test(content),
    );

    return !(
      hasEmail ||
      hasPhone ||
      hasSSN ||
      hasCreditCard ||
      hasIP ||
      hasURL ||
      hasUUID ||
      hasNumericID ||
      hasAddress ||
      hasConservativePII
    );
  }

  /**
   * Creates a summary for logging (without exposing actual PII)
   */
  public static createScrubbingReport(result: PIIScrubbingResult): string {
    if (!result.piiDetected) {
      return "No PII detected in content";
    }

    const reductionPercent = (
      ((result.originalLength - result.scrubbedLength) /
        result.originalLength) *
      100
    ).toFixed(1);
    return `PII scrubbed: ${result.redactedTypes.join(", ")}. Content reduced by ${reductionPercent}%`;
  }
}
