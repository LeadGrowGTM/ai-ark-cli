/**
 * Tests for env-loader.ts — the .env discovery logic.
 *
 * Issue #3: hardcoded Windows path C:/Users/mitch/Everything_CC/ai-ark-cli
 * must not appear in the search sequence. Search should be: CLI dir, then CWD.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";

import { loadEnvFromDirs, defaultEnvDirs } from "../src/env-loader.js";

describe("loadEnvFromDirs", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `ai-ark-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("loads env from first directory that contains a .env file", () => {
    writeFileSync(resolve(tmpDir, ".env"), "TEST_VAR=hello\n");
    const env: Record<string, string> = {};
    const searched = loadEnvFromDirs([tmpDir, "/nonexistent"], env);
    expect(env["TEST_VAR"]).toBe("hello");
    expect(searched).toContain(tmpDir);
  });

  test("falls through to second directory when first has no .env", () => {
    const dir2 = resolve(tmpDir, "sub");
    mkdirSync(dir2);
    writeFileSync(resolve(dir2, ".env"), "FROM_DIR2=yes\n");
    const env: Record<string, string> = {};
    loadEnvFromDirs([tmpDir, dir2], env);
    expect(env["FROM_DIR2"]).toBe("yes");
  });

  test("does not overwrite already-set values", () => {
    writeFileSync(resolve(tmpDir, ".env"), "EXISTING=override\n");
    const env: Record<string, string> = { EXISTING: "keep" };
    loadEnvFromDirs([tmpDir], env);
    expect(env["EXISTING"]).toBe("keep");
  });

  test("strips surrounding quotes from values", () => {
    writeFileSync(resolve(tmpDir, ".env"), 'QUOTED="my value"\n');
    const env: Record<string, string> = {};
    loadEnvFromDirs([tmpDir], env);
    expect(env["QUOTED"]).toBe("my value");
  });

  test("returns all searched directories regardless of success", () => {
    const searched = loadEnvFromDirs(["/no-exist-1", "/no-exist-2"], {});
    expect(searched).toEqual(["/no-exist-1", "/no-exist-2"]);
  });

  test("defaultEnvDirs returns at most two paths: cliDir and cwd", () => {
    // The old code had THREE dirs: cliDir, hardcoded C:/Users/mitch/..., cwd.
    // After the fix the list must be at most 2 entries.
    // If cliDir === cwd we get 1; otherwise exactly 2.
    const dirs = defaultEnvDirs();
    expect(dirs.length).toBeLessThanOrEqual(2);
    expect(dirs.length).toBeGreaterThanOrEqual(1);
  });
});
