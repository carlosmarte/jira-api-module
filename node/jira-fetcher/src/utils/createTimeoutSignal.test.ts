import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createTimeoutSignal, mergeAbortSignals } from "./createTimeoutSignal.js";

describe("createTimeoutSignal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create an AbortSignal", () => {
    const signal = createTimeoutSignal(1000);
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
  });

  it("should abort signal after timeout", () => {
    const signal = createTimeoutSignal(1000);
    expect(signal.aborted).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(signal.aborted).toBe(true);
  });

  it("should not abort before timeout expires", () => {
    const signal = createTimeoutSignal(1000);

    vi.advanceTimersByTime(500);
    expect(signal.aborted).toBe(false);

    vi.advanceTimersByTime(499);
    expect(signal.aborted).toBe(false);
  });

  it("should clean up timeout when aborted manually", () => {
    createTimeoutSignal(1000);
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    // Manually abort the signal (simulating cleanup)
    vi.advanceTimersByTime(1000);

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("should work with different timeout values", () => {
    const signal1 = createTimeoutSignal(500);
    const signal2 = createTimeoutSignal(1500);

    vi.advanceTimersByTime(500);
    expect(signal1.aborted).toBe(true);
    expect(signal2.aborted).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(signal2.aborted).toBe(true);
  });
});

describe("mergeAbortSignals", () => {
  it("should create a merged signal", () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const merged = mergeAbortSignals([controller1.signal, controller2.signal]);
    expect(merged).toBeInstanceOf(AbortSignal);
    expect(merged.aborted).toBe(false);
  });

  it("should abort when first signal aborts", () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const merged = mergeAbortSignals([controller1.signal, controller2.signal]);

    controller1.abort();
    expect(merged.aborted).toBe(true);
  });

  it("should abort when second signal aborts", () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    const merged = mergeAbortSignals([controller1.signal, controller2.signal]);

    controller2.abort();
    expect(merged.aborted).toBe(true);
  });

  it("should abort when any signal in array aborts", () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();
    const controller3 = new AbortController();

    const merged = mergeAbortSignals([
      controller1.signal,
      controller2.signal,
      controller3.signal,
    ]);

    expect(merged.aborted).toBe(false);
    controller2.abort();
    expect(merged.aborted).toBe(true);
  });

  it("should immediately abort if any input signal is already aborted", () => {
    const controller1 = new AbortController();
    const controller2 = new AbortController();

    controller1.abort();

    const merged = mergeAbortSignals([controller1.signal, controller2.signal]);
    expect(merged.aborted).toBe(true);
  });

  it("should handle empty array", () => {
    const merged = mergeAbortSignals([]);
    expect(merged).toBeInstanceOf(AbortSignal);
    expect(merged.aborted).toBe(false);
  });

  it("should handle single signal", () => {
    const controller = new AbortController();
    const merged = mergeAbortSignals([controller.signal]);

    expect(merged.aborted).toBe(false);
    controller.abort();
    expect(merged.aborted).toBe(true);
  });
});
