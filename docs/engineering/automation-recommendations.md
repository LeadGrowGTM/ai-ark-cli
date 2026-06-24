# Automation Recommendations

Claude Code automation recommendations specific to the ai-ark-cli repo.

---

## Pre-commit Hooks

### 1. TypeScript type-check on commit

**What:** Run `tsc --noEmit` before every commit to catch type errors before they land.  
**Why it helps:** The repo has no CI configured. Type errors in command files or filter builders currently go undetected until runtime.  
**Implementation sketch:**
```bash
# .husky/pre-commit or lefthook.yml pre-commit hook
bun run tsc --noEmit
```
Add `typescript` check to a pre-commit config via `bun add -d lefthook` and `lefthook install`.

### 2. Run the test suite on commit

**What:** Execute `bun test` before every commit.  
**Why it helps:** The filter and URL-builder logic has 33 test cases that catch regressions in less than 100ms. Running them on commit costs nothing.  
**Implementation sketch:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    test:
      run: bun test
```

### 3. Guard against console.log in command files

**What:** Lint for `console.log` calls in `src/commands/` (should be `console.error` or `process.stderr.write`).  
**Why it helps:** A stray `console.log` in a command breaks `--format csv > file.csv` pipelines silently. The stdout/stderr convention is critical.  
**Implementation sketch:**
```bash
# In pre-commit hook
! grep -rn "console\.log" src/commands/ || (echo "ERROR: console.log in src/commands/ — use console.error or process.stderr.write" && exit 1)
```

---

## Skills

### 4. Invoke the `tdd` skill for new command development

**What:** Use `/tdd` when adding a new command (e.g., `people lookalike`, `companies enrich`).  
**Why it helps:** The filter-builder pattern is highly testable without network access. TDD drives cleaner command implementations and catches edge cases in filter construction before touching the API.

### 5. Invoke `codebase-design` skill before refactoring filters.ts

**What:** Run `/codebase-design` before touching `filters.ts` or the type system.  
**Why it helps:** `filters.ts` is the highest-coupling module — it's imported by every command. Interface changes ripple widely. The design skill surfaces impact before edits.

---

## MCP Server Connections

### 6. GitHub MCP for issue-driven development

**What:** Connect the GitHub MCP server to this repo.  
**Why it helps:** Enables agents to read open issues, create issues from bugs found during analysis, and link commits to issues without leaving Claude Code.  
**Implementation sketch:** Add to `.claude/settings.json`:
```json
{ "mcpServers": { "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] } } }
```

---

## Custom Agents

### 7. `ark-filter-validator` agent

**What:** An agent that takes a CLI command string, parses the flags, and validates the resulting API request body against the known filter schema.  
**Why it helps:** Filter construction bugs (wrong shape, wrong key) currently only surface as 400 errors from the API. A validator agent catches them locally.  
**Implementation sketch:** Agent reads `src/types/requests.ts` and `src/filters.ts`, then runs `buildAccountFilter` + `buildContactFilter` against parsed opts and checks the output shape.

### 8. `ark-dry-run-checker` agent

**What:** Agent that runs `--dry-run` on a given command and checks that (a) no API call was made, (b) the review URL is valid, and (c) stdout is empty.  
**Why it helps:** Verifies the dry-run contract hasn't been broken by command changes. Can be run as a smoke test after any edit to a command file.

---

## File Watchers / Background Automations

### 9. Auto-reindex docs when source files change

**What:** Watch `src/**/*.ts` for changes and regenerate `docs/architecture/interface-depth.md` automatically.  
**Why it helps:** The interface depth analysis goes stale as new functions are added or removed. A file watcher keeps it current without manual re-runs.  
**Implementation sketch:**
```bash
bun --watch docs/scripts/update-interface-depth.ts
```
(Script to be written — reads each source file, counts exported vs. unexported functions, writes the table.)

### 10. Scheduled credit-check notification

**What:** Run `bun run src/index.ts credits` daily and alert when credits drop below a threshold.  
**Why it helps:** API credit exhaustion causes silent failures on export commands — jobs submit but never return results. An early-warning check prevents wasted debugging time.  
**Implementation sketch:** Add a cron via `.claude/scheduled_tasks.lock` or a simple cron job that runs the credits command and checks the numeric value.
