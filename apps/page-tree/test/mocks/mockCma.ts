import type { CMAClientLike } from "../../src/core/types";
import { vi } from "vitest";

export const mockCma: CMAClientLike = {
  entry: {
    getMany: vi.fn().mockResolvedValue({
      items: [],
      total: 0,
      skip: 0,
      limit: 1000,
    }),
  },
};
