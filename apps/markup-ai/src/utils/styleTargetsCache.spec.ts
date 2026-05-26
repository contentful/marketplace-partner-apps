import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TargetResponse } from "../api-client/types.gen";
import {
  clearStyleTargetsCache,
  readStyleTargetsCache,
  writeStyleTargetsCache,
} from "./styleTargetsCache";

const sample: TargetResponse[] = [
  { id: "sg-1", display_name: "AP", is_default: true, enabled: true },
  { id: "sg-2", display_name: "Chicago", is_default: false, enabled: true },
];

describe("styleTargetsCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-06T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("returns null when no entry is stored", () => {
    expect(readStyleTargetsCache("k")).toBeNull();
  });

  it("returns null when apiKey is empty", () => {
    writeStyleTargetsCache("k", sample);
    expect(readStyleTargetsCache(null)).toBeNull();
    expect(readStyleTargetsCache("")).toBeNull();
  });

  it("round-trips targets within the TTL", () => {
    writeStyleTargetsCache("k", sample);
    expect(readStyleTargetsCache("k")).toEqual(sample);
  });

  it("invalidates after the 5-minute TTL", () => {
    writeStyleTargetsCache("k", sample);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(readStyleTargetsCache("k")).toBeNull();
  });

  it("invalidates when a different api key reads the cache", () => {
    writeStyleTargetsCache("alice", sample);
    expect(readStyleTargetsCache("bob")).toBeNull();
    expect(readStyleTargetsCache("alice")).toEqual(sample);
  });

  it("clears via clearStyleTargetsCache()", () => {
    writeStyleTargetsCache("k", sample);
    clearStyleTargetsCache();
    expect(readStyleTargetsCache("k")).toBeNull();
  });

  it("survives a malformed cache entry", () => {
    localStorage.setItem("markupai.styleTargetsCache.v1", "{ this is not json");
    expect(readStyleTargetsCache("k")).toBeNull();
  });
});
