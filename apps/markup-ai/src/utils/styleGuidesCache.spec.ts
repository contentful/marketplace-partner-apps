import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TargetResponse } from "../api-client/types.gen";
import {
  clearStyleGuidesCache,
  readStyleGuidesCache,
  writeStyleGuidesCache,
} from "./styleGuidesCache";

const sample: TargetResponse[] = [
  { id: "sg-1", display_name: "AP", is_default: true, enabled: true },
  { id: "sg-2", display_name: "Chicago", is_default: false, enabled: true },
];

describe("styleGuidesCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("returns null when no entry is stored", () => {
    expect(readStyleGuidesCache("k")).toBeNull();
  });

  it("returns null when apiKey is empty", () => {
    writeStyleGuidesCache("k", sample);
    expect(readStyleGuidesCache(null)).toBeNull();
    expect(readStyleGuidesCache("")).toBeNull();
  });

  it("round-trips style guides within the TTL", () => {
    writeStyleGuidesCache("k", sample);
    expect(readStyleGuidesCache("k")).toEqual(sample);
  });

  it("invalidates after the 5-minute TTL", () => {
    writeStyleGuidesCache("k", sample);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(readStyleGuidesCache("k")).toBeNull();
  });

  it("invalidates when a different api key reads the cache", () => {
    writeStyleGuidesCache("alice", sample);
    expect(readStyleGuidesCache("bob")).toBeNull();
    expect(readStyleGuidesCache("alice")).toEqual(sample);
  });

  it("clears via clearStyleGuidesCache()", () => {
    writeStyleGuidesCache("k", sample);
    clearStyleGuidesCache();
    expect(readStyleGuidesCache("k")).toBeNull();
  });

  it("survives a malformed cache entry", () => {
    localStorage.setItem("markupai.styleGuidesCache.v1", "{ this is not json");
    expect(readStyleGuidesCache("k")).toBeNull();
  });
});
