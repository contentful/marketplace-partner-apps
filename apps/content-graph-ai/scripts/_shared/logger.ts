export const logger = {
  info(msg: string, meta?: Record<string, unknown>) {
    console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : "");
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : "");
  },
  error(msg: string, meta?: Record<string, unknown>) {
    console.error(`[ERROR] ${msg}`, meta ? JSON.stringify(meta) : "");
  },
};
