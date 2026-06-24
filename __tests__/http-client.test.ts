/**
 * Tests for AiArkClient — injectable fetcher seam.
 *
 * Issue #21: HTTP client has no injection point for test doubles.
 * After the fix, AiArkClient accepts an optional `fetcher` parameter in its
 * constructor so tests can intercept HTTP without a real network or mocking
 * the global fetch.
 */

import { describe, test, expect } from "bun:test";
import { AiArkClient, AiArkApiError } from "../src/client/http.js";

// ---------------------------------------------------------------------------
// Minimal fetch double — returns a pre-canned Response
// ---------------------------------------------------------------------------

function makeFetcher(status: number, body: unknown): typeof fetch {
  return () =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ) as ReturnType<typeof fetch>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AiArkClient — injectable fetcher", () => {
  test("GET request resolves with parsed JSON when fetcher returns 200", async () => {
    const fetcher = makeFetcher(200, { credits: 42 });
    const client = new AiArkClient("test-key", fetcher);
    // @ts-expect-error — cast endpoint to bypass literal-type constraint
    const result = await client.get<{ credits: number }>("/credits" as any);
    expect(result).toEqual({ credits: 42 });
  });

  test("POST request resolves with parsed JSON when fetcher returns 200", async () => {
    const fetcher = makeFetcher(200, { results: [] });
    const client = new AiArkClient("test-key", fetcher);
    // @ts-expect-error — cast endpoint
    const result = await client.post<{ results: unknown[] }>("/search" as any, { q: "test" });
    expect(result).toEqual({ results: [] });
  });

  test("throws AiArkApiError when fetcher returns structured 400", async () => {
    const errorBody = {
      status: 400,
      error: "Invalid parameter",
      path: "/search",
      timestamp: "2026-06-22T00:00:00Z",
    };
    const fetcher = makeFetcher(400, errorBody);
    const client = new AiArkClient("test-key", fetcher);
    // @ts-expect-error
    await expect(client.get("/search" as any)).rejects.toBeInstanceOf(AiArkApiError);
  });

  test("throws generic Error when fetcher returns unstructured 500", async () => {
    const fetcher = makeFetcher(500, { unexpected: true });
    const client = new AiArkClient("test-key", fetcher);
    // @ts-expect-error
    await expect(client.get("/search" as any)).rejects.toThrow(/HTTP 500/);
  });

  test("constructor still works without fetcher argument (default fetch)", () => {
    // Must not throw — global fetch is the default
    expect(() => new AiArkClient("test-key")).not.toThrow();
  });

  test("constructor rejects empty API key regardless of fetcher", () => {
    const fetcher = makeFetcher(200, {});
    expect(() => new AiArkClient("", fetcher)).toThrow("API key must not be empty");
  });

  test("fetcher receives the correct Authorization header (X-TOKEN)", async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const capturingFetcher: typeof fetch = (url, init) => {
      capturedHeaders = Object.fromEntries(
        new Headers(init?.headers ?? {}).entries(),
      );
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ) as ReturnType<typeof fetch>;
    };
    const client = new AiArkClient("my-secret-key", capturingFetcher);
    // @ts-expect-error
    await client.get("/credits" as any);
    expect(capturedHeaders?.["x-token"]).toBe("my-secret-key");
  });
});
