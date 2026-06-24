---
paths:
  - "src/**/*.ts"
---

# CLI Output Conventions

Data goes to stdout. Everything else goes to stderr.

## stdout (pipeable data only)

- Search results, export data, credit balances
- Must be clean JSON, CSV, or table depending on `--format`
- Never mix progress, errors, or review URLs into stdout

## stderr (human diagnostics)

- Errors (`console.error`)
- Progress indicators (polling status, spinners)
- Review URLs (ai-ark.com links for inspecting filters)
- Dry-run payload dumps

This separation allows `ai-ark people search --format csv > leads.csv` to produce a clean file while the operator sees progress in the terminal.

## --dry-run contract

Every search/export command supports `--dry-run`. It must:
1. Print the review URL and request payload to stderr
2. Exit without making any API call (zero credits spent)
3. Never write to stdout
