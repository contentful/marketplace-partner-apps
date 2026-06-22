export class VendorDependencyError extends Error {
  vendor: string;

  constructor(vendor: string, message: string) {
    super(`[${vendor}] ${message}`);
    this.name = "VendorDependencyError";
    this.vendor = vendor;
  }
}

export function isVendorDependencyError(
  error: unknown,
): error is VendorDependencyError {
  return error instanceof VendorDependencyError;
}

export function isRetriableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("429") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("temporarily unavailable") ||
    message.toLowerCase().includes("vendordependencyerror") ||
    message.toLowerCase().includes("vendor dependency")
  );
}
