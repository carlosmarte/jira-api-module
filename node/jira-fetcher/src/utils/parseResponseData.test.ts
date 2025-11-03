import { describe, it, expect } from "vitest";
import { parseResponseData } from "./parseResponseData.js";

describe("parseResponseData", () => {
  it("should parse JSON response correctly", async () => {
    const jsonData = { key: "value", number: 123 };
    const response = new Response(JSON.stringify(jsonData), {
      headers: { "content-type": "application/json" },
    });

    const result = await parseResponseData(response);
    expect(result).toEqual(jsonData);
  });

  it("should handle empty JSON response", async () => {
    const response = new Response("", {
      headers: { "content-type": "application/json" },
    });

    const result = await parseResponseData(response);
    expect(result).toBeNull();
  });

  it("should handle whitespace-only JSON response", async () => {
    const response = new Response("   ", {
      headers: { "content-type": "application/json" },
    });

    const result = await parseResponseData(response);
    expect(result).toBeNull();
  });

  it("should parse JSON with charset in content-type", async () => {
    const jsonData = { test: "data" };
    const response = new Response(JSON.stringify(jsonData), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });

    const result = await parseResponseData(response);
    expect(result).toEqual(jsonData);
  });

  it("should parse text response correctly", async () => {
    const textData = "Hello, World!";
    const response = new Response(textData, {
      headers: { "content-type": "text/plain" },
    });

    const result = await parseResponseData(response);
    expect(result).toBe(textData);
  });

  it("should parse HTML response as text", async () => {
    const htmlData = "<html><body>Hello</body></html>";
    const response = new Response(htmlData, {
      headers: { "content-type": "text/html" },
    });

    const result = await parseResponseData(response);
    expect(result).toBe(htmlData);
  });

  it("should parse binary response as ArrayBuffer", async () => {
    const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
    const response = new Response(binaryData, {
      headers: { "content-type": "application/octet-stream" },
    });

    const result = await parseResponseData(response);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(result as ArrayBuffer)).toEqual(binaryData);
  });

  it("should default to binary for unknown content types", async () => {
    const data = new Uint8Array([1, 2, 3]);
    const response = new Response(data, {
      headers: { "content-type": "application/custom" },
    });

    const result = await parseResponseData(response);
    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  it("should handle missing content-type header", async () => {
    const data = new Uint8Array([1, 2, 3]);
    const response = new Response(data);

    const result = await parseResponseData(response);
    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  it("should parse complex nested JSON", async () => {
    const complexData = {
      user: { name: "John", age: 30 },
      items: [1, 2, 3],
      metadata: { created: "2024-01-01" },
    };
    const response = new Response(JSON.stringify(complexData), {
      headers: { "content-type": "application/json" },
    });

    const result = await parseResponseData(response);
    expect(result).toEqual(complexData);
  });
});
