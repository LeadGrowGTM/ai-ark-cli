# ADR-0001: Bun Runtime with Direct TypeScript Execution

## Status

Accepted

## Context

The CLI needed a runtime strategy. The main options were:

1. **Node.js + tsc compile step** — standard ecosystem choice; requires a `dist/` directory that must be rebuilt on every change during development
2. **Node.js + ts-node/tsx** — eliminates the build step in dev but adds a runtime dependency and increases startup latency
3. **Bun** — runs TypeScript source directly without a build step; ships a single compiled binary via `bun build` for distribution

The target users are LeadGrow operators running searches from the terminal, often iterating quickly on filter combinations. Fast iteration (no rebuild loop) and clean piping (`--format csv > leads.csv`) are the primary developer and user experience requirements.

## Decision

Use **Bun 1.3.9+** as the only supported runtime. TypeScript is executed directly from `src/index.ts` with no intermediate compilation step during development. The binary for distribution is produced by `bun build src/index.ts --outdir dist --target bun`.

The project is ESM-only (`"type": "module"` in package.json). All imports use `.js` extensions (Bun resolves to `.ts` at runtime). No CommonJS compatibility is maintained.

## Consequences

**Good:**
- Zero build step during development — `bun run src/index.ts` is instant
- TypeScript types are available at authoring time with zero transpile lag
- `bun build` produces a single deployable binary (`dist/index.js`)
- Bun's built-in test runner is available (though not yet configured)
- Consistent with the broader LeadGrow workspace runtime standard

**Bad:**
- Node.js users cannot run the CLI without installing Bun — non-negotiable runtime dependency
- Some npm packages have Bun compatibility quirks (rare but possible)
- The hardcoded fallback path in `src/index.ts` (`C:/Users/mitch/Everything_CC/ai-ark-cli`) is Windows-specific and will need to change if the CLI is distributed broadly
- No test runner is configured yet — Bun's built-in test runner exists but hasn't been wired up; manual verification against a live API key is the current verification approach
