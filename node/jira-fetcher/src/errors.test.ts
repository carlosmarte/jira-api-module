import { describe, it, expect } from "vitest";
import { ErrorCode, JiraFetchError } from "./errors.js";

describe("JiraFetchError", () => {
  it("should create error with code and message", () => {
    const error = new JiraFetchError(ErrorCode.NETWORK, "Network failed");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(JiraFetchError);
    expect(error.name).toBe("JiraFetchError");
    expect(error.code).toBe(ErrorCode.NETWORK);
    expect(error.message).toBe("Network failed");
  });

  it("should create error with all options", () => {
    const cause = new Error("Original error");
    const error = new JiraFetchError(ErrorCode.RESPONSE, "Request failed", {
      status: 404,
      details: { message: "Not found" },
      url: "https://api.example.com/data",
      method: "GET",
      cause,
    });

    expect(error.code).toBe(ErrorCode.RESPONSE);
    expect(error.message).toBe("Request failed");
    expect(error.status).toBe(404);
    expect(error.details).toEqual({ message: "Not found" });
    expect(error.url).toBe("https://api.example.com/data");
    expect(error.method).toBe("GET");
    expect(error.cause).toBe(cause);
  });

  it("should create NETWORK error", () => {
    const error = new JiraFetchError(ErrorCode.NETWORK, "Connection failed");
    expect(error.code).toBe(ErrorCode.NETWORK);
  });

  it("should create RESPONSE error", () => {
    const error = new JiraFetchError(ErrorCode.RESPONSE, "Bad request", {
      status: 400,
    });
    expect(error.code).toBe(ErrorCode.RESPONSE);
    expect(error.status).toBe(400);
  });

  it("should create TIMEOUT error", () => {
    const error = new JiraFetchError(ErrorCode.TIMEOUT, "Request timed out");
    expect(error.code).toBe(ErrorCode.TIMEOUT);
  });

  it("should create CONFIGURATION error", () => {
    const error = new JiraFetchError(
      ErrorCode.CONFIGURATION,
      "Invalid config"
    );
    expect(error.code).toBe(ErrorCode.CONFIGURATION);
  });

  describe("toJSON", () => {
    it("should serialize error to JSON", () => {
      const error = new JiraFetchError(ErrorCode.RESPONSE, "Request failed", {
        status: 500,
        details: { error: "Internal error" },
        url: "https://api.example.com/data",
        method: "POST",
      });

      const json = error.toJSON();
      expect(json).toEqual({
        name: "JiraFetchError",
        code: ErrorCode.RESPONSE,
        message: "Request failed",
        status: 500,
        details: { error: "Internal error" },
        url: "https://api.example.com/data",
        method: "POST",
      });
    });

    it("should serialize minimal error", () => {
      const error = new JiraFetchError(ErrorCode.NETWORK, "Network failed");

      const json = error.toJSON();
      expect(json).toEqual({
        name: "JiraFetchError",
        code: ErrorCode.NETWORK,
        message: "Network failed",
        status: undefined,
        details: undefined,
        url: undefined,
        method: undefined,
      });
    });
  });

  describe("isJiraFetchError", () => {
    it("should return true for JiraFetchError instance", () => {
      const error = new JiraFetchError(ErrorCode.NETWORK, "Failed");
      expect(JiraFetchError.isJiraFetchError(error)).toBe(true);
    });

    it("should return false for regular Error", () => {
      const error = new Error("Failed");
      expect(JiraFetchError.isJiraFetchError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(JiraFetchError.isJiraFetchError(null)).toBe(false);
      expect(JiraFetchError.isJiraFetchError(undefined)).toBe(false);
      expect(JiraFetchError.isJiraFetchError("error")).toBe(false);
      expect(JiraFetchError.isJiraFetchError({})).toBe(false);
    });
  });

  describe("hasErrorCode", () => {
    it("should return true for matching error code", () => {
      const error = new JiraFetchError(ErrorCode.NETWORK, "Failed");
      expect(JiraFetchError.hasErrorCode(error, ErrorCode.NETWORK)).toBe(true);
    });

    it("should return false for non-matching error code", () => {
      const error = new JiraFetchError(ErrorCode.NETWORK, "Failed");
      expect(JiraFetchError.hasErrorCode(error, ErrorCode.TIMEOUT)).toBe(
        false
      );
    });

    it("should return false for regular Error", () => {
      const error = new Error("Failed");
      expect(JiraFetchError.hasErrorCode(error, ErrorCode.NETWORK)).toBe(
        false
      );
    });

    it("should return false for non-error values", () => {
      expect(JiraFetchError.hasErrorCode(null, ErrorCode.NETWORK)).toBe(false);
      expect(JiraFetchError.hasErrorCode(undefined, ErrorCode.NETWORK)).toBe(
        false
      );
    });
  });

  it("should maintain stack trace", () => {
    const error = new JiraFetchError(ErrorCode.NETWORK, "Failed");
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain("JiraFetchError");
  });

  it("should handle complex details object", () => {
    const complexDetails = {
      errors: [
        { field: "email", message: "Invalid format" },
        { field: "password", message: "Too short" },
      ],
      metadata: { timestamp: "2024-01-01T00:00:00Z" },
    };

    const error = new JiraFetchError(ErrorCode.RESPONSE, "Validation failed", {
      status: 422,
      details: complexDetails,
    });

    expect(error.details).toEqual(complexDetails);
  });
});
