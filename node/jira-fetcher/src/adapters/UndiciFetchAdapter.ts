import { fetch as undiciFetch } from "undici";
import type { FetchAdapter } from "../types.js";

/**
 * Fetch adapter implementation using undici.
 * Undici is a fast, reliable, and spec-compliant HTTP/1.1 client for Node.js.
 *
 * This adapter is provided as a default implementation but users can provide
 * their own fetch implementation (node-fetch, cross-fetch, browser fetch, etc.)
 */
export class UndiciFetchAdapter implements FetchAdapter {
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    return undiciFetch(url, init);
  }
}
