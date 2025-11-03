/**
 * Parses the response data based on content type.
 * Automatically detects JSON, text, or binary responses.
 *
 * @param response - The fetch Response object
 * @returns Parsed response data (JSON object, text, or ArrayBuffer)
 */
export async function parseResponseData(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  // Parse JSON responses
  if (contentType.includes("application/json")) {
    const text = await response.text();
    // Handle empty responses
    if (!text || text.trim() === "") {
      return null;
    }
    return JSON.parse(text);
  }

  // Parse text responses
  if (contentType.includes("text/")) {
    return response.text();
  }

  // Default to binary for everything else
  return response.arrayBuffer();
}
