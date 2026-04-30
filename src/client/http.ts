/**
 * Typed HTTP client for the AI Ark API.
 * Handles authentication, rate limiting, and structured error handling.
 */

import type { ApiError, ApiEndpoint } from "../types/api.js";
import { RateLimiter } from "./rate-limiter.js";

const BASE_URL = "https://api.ai-ark.com/api/developer-portal/v1";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class AiArkApiError extends Error {
  readonly status: number;
  readonly apiError: string;
  readonly path: string;
  readonly timestamp: string;

  constructor(status: number, apiError: string, path: string, timestamp: string) {
    const locationSuffix = path ? ` [${path}]` : "";
    super(`AI Ark API Error (${status}): ${apiError}${locationSuffix}`);
    this.name = "AiArkApiError";
    this.status = status;
    this.apiError = apiError;
    this.path = path;
    this.timestamp = timestamp;
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class AiArkClient {
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new Error("API key must not be empty");
    }
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter();
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-TOKEN": this.apiKey,
    };
  }

  private get getHeaders(): Record<string, string> {
    return { "X-TOKEN": this.apiKey };
  }

  async get<T>(endpoint: ApiEndpoint): Promise<T> {
    return this.requestWithRetry<T>(() =>
      fetch(`${BASE_URL}${endpoint}`, {
        method: "GET",
        headers: this.getHeaders,
      }),
    );
  }

  async post<T>(endpoint: ApiEndpoint, body: unknown): Promise<T> {
    return this.requestWithRetry<T>(() =>
      fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
      }),
    );
  }

  private async requestWithRetry<T>(
    doFetch: () => Promise<Response>,
    maxRetries = 5,
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await this.rateLimiter.acquire();
      const response = await doFetch();

      if (response.status === 429) {
        if (attempt === maxRetries) {
          throw new Error("HTTP 429: Too Many Requests (exhausted retries)");
        }
        const backoff = Math.min(2 ** attempt * 5, 60);
        process.stderr.write(
          `  Rate limited — backing off ${backoff}s (attempt ${attempt + 1}/${maxRetries})\n`,
        );
        await new Promise((r) => setTimeout(r, backoff * 1000));
        continue;
      }

      return this.handleResponse<T>(response);
    }
    throw new Error("Unreachable");
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      return response.json() as Promise<T>;
    }

    // Attempt to parse structured API error
    let parsed: ApiError | null = null;
    try {
      parsed = (await response.json()) as ApiError;
    } catch {
      // Body wasn't parseable JSON — fall through to generic error
    }

    if (parsed && parsed.error) {
      throw new AiArkApiError(
        parsed.status ?? response.status,
        parsed.error,
        parsed.path ?? "",
        parsed.timestamp ?? new Date().toISOString(),
      );
    }

    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createClient(): AiArkClient {
  const apiKey = process.env.AI_ARK_API_KEY;
  if (!apiKey) {
    const searchedDirs = (process.env._AI_ARK_ENV_SEARCHED || "none").split(";").filter(Boolean);
    throw new Error(
      `AI_ARK_API_KEY environment variable is not set.\n` +
      `  Searched for .env in: ${searchedDirs.join(", ")}\n` +
      `  Get your key at https://app.ai-ark.com/settings/api-management/dashboard`,
    );
  }
  return new AiArkClient(apiKey);
}
