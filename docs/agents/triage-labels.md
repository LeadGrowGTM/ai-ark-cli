# Triage Labels

Five canonical states for all issues in ai-ark-cli.

## needs-triage

**When to apply:** Immediately on creation. Every new issue starts here.  
**Who acts next:** Maintainer or contributor who triages the queue.  
**Example:** A new issue "people search returns wrong results" arrives — add needs-triage before any investigation.

## needs-info

**When to apply:** The issue cannot be reproduced or diagnosed without additional information from the reporter.  
**Who acts next:** The original reporter must reply with the requested info.  
**Example:** Rate-limit error reported with no command flags or API response body. Request the exact `bun run src/index.ts` invocation and the full stderr output.

## ready-for-agent

**When to apply:** The issue is scoped, reproducible, and localized to a specific module. An AI coding agent can attempt a fix without human judgment.  
**Who acts next:** An agent (Claude Code or similar). Assign and close the loop with a test.  
**Example:** "rangeFilter('100-') silently returns undefined instead of erroring" — the input format, expected output, and affected file (`src/filters.ts`) are all known.

## ready-for-human

**When to apply:** The fix requires human judgment, API credentials, platform access, or architectural tradeoffs that shouldn't be automated.  
**Who acts next:** A human contributor or maintainer.  
**Example:** "AI Ark changed the bulk_include_company_domain parameter format" — requires testing against the live API with a real key and confirming the new URL grammar with the platform team.

## wontfix

**When to apply:** The behavior is intentional, out of scope, or costs more to address than the benefit it delivers. Document why.  
**Who acts next:** Close the issue with a comment explaining the reasoning.  
**Example:** "Support Node.js runtime" — the repo is intentionally Bun-only (TypeScript ESM, no build step). Switching runtimes would undo the core architectural tradeoff.
