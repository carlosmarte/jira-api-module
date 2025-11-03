/**
 * Creates an AbortSignal that aborts after the specified timeout.
 * Automatically cleans up the timeout when the signal is aborted.
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that will abort after the timeout
 */
export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  // Clean up the timeout when the signal is aborted
  controller.signal.addEventListener("abort", () => clearTimeout(timeout), {
    once: true,
  });

  return controller.signal;
}

/**
 * Merges multiple AbortSignals into a single signal.
 * If any of the input signals aborts, the returned signal will abort.
 *
 * @param signals - Array of AbortSignals to merge
 * @returns A new AbortSignal that aborts when any input signal aborts
 */
export function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }

    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return controller.signal;
}
