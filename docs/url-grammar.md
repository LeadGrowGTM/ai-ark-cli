# AI Ark Platform URL Grammar

Reverse-engineered mapping from the CLI's `FilterOpts` → `app.ai-ark.com/search/{people,companies}` URL query params. Used by `src/url-builder.ts` to emit clickable "review this search" links alongside every API call.

## Why this exists

Without observability, the CLI is a black box: you set filters, numbers come back, and if the count is wrong you have no way to see _what the platform thinks you asked for_. Every search now prints a URL that opens the UI with the same filters applied, so you can visually verify before (or after) spending credits.

## Separators

| Separator | Purpose                              | URL-encoded |
| --------- | ------------------------------------ | ----------- |
| `^`       | Multi-value OR (include/exclude list)| `%5E`       |
| `::`      | Hierarchy (continent::country)       | `%3A%3A`    |
| `, `      | CSV inside bulk domain blob          | `%2C+`      |
| `>`       | Duration min/max divider             | `%3E`       |
| `:`       | Years:months inside a duration side  | `%3A`       |

The `^` separator is the AI Ark UI's primary multi-value glue. Use it anywhere you'd otherwise expect a comma in an array.

## Parameter reference

### People surface (`/search/people`)

| URL param                             | FilterOpt                    | Format                                   | Example |
| ------------------------------------- | ---------------------------- | ---------------------------------------- | ------- |
| ~~`bulk_include_company_domain`~~     | `--domain`                   | **dropped — paste manually in-platform** | see side-channel note |
| ~~`bulk_exclude_company_domain`~~     | `--exclude-domain`           | **dropped — paste manually in-platform** | see side-channel note |
| `company_include_name`                | `--company`                  | `^`-joined                               | `hubspot^salesforce` |
| `company_exclude_name`                | `--exclude-company`          | `^`-joined                               | — |
| `company_include_industry`            | `--industry`                 | `^`-joined                               | `software^saas` |
| `company_include_technology`          | `--technology`               | `^`-joined                               | `hubspot^segment` |
| `company_employees`                   | `--employees`                | `{min}>{max}`                            | `50>500` |
| `company_include_funding_type`        | `--funding-type`             | `^`-joined                               | `SERIES_A^SERIES_B` |
| `current_job_include_job_title`       | `--title`                    | `^`-joined                               | `growth^sales^gtm` |
| `current_job_exclude_job_title`       | `--exclude-title`            | `^`-joined                               | `cto^cfo` |
| `previous_job_include_job_title`      | `--previous-title`           | `^`-joined                               | `sdr` |
| `current_job_include_seniority`       | `--seniority`                | `^`-joined                               | `vp^director^c_suite` |
| `current_job_exclude_seniority`       | `--exclude-seniority`        | `^`-joined                               | `manager` |
| `current_job_include_department`      | `--department`               | `^`-joined                               | `sales^marketing` |
| `current_job_exclude_department`      | `--exclude-department`       | `^`-joined                               | — |
| `current_job_experience_current_job`  | `--job-duration-min/max`     | `{Y}:{M}>{Y}:{M}`, empty = 0             | `:2>1:` (min 2mo, max 1yr) |
| `people_include_keywords`             | `--keyword`                  | `^`-joined                               | `gtm^revops` |
| `people_include_skills`               | `--skills`                   | `^`-joined                               | `salesforce^python` |
| `profile_badge_contacts_include`      | `--badge`                    | `^`-joined enum                          | `HIRING^PAID_SOCIAL_MEMBERS` |
| `profile_badge_contacts_exclude`      | `--exclude-badge`            | `^`-joined enum                          | `OPEN_TO_WORK` |
| `contact_include_location_region`     | `--location`                 | `{continent}::{country}` joined by `^`   | `Europe::Spain^North America::United States` |
| `contact_exclude_location_region`     | `--exclude-location`         | same                                     | — |
| `people_include_name`                 | `--name`                     | `^`-joined                               | `Jane Smith` |

### Companies surface (`/search/companies`)

Mirrors the people surface for company-scoped filters. Location uses `company_include_location_region`/`company_exclude_location_region`. Keyword uses `company_include_keywords`.

## Duration encoding

`current_job_experience_current_job` encodes min + max tenure in the current role as two `Y:M` strings separated by `>`. Empty segments mean zero.

| Human-readable           | Encoded (actual output) |
| ------------------------ | ----------------------- |
| Min 2 months, max 1 year | `:2>1:`                 |
| Min 1 year, max 3 years  | `1:>3:`                 |
| Min 6 months, no max     | `:6>:` ⚠️ unverified    |
| No min, max 3 months     | `:>:3` ⚠️ unverified    |

The CLI takes `--job-duration-min`/`--job-duration-max` as total months. The builder divmods that into `{year, month}` for both the URL and the JSON payload. Every segment is always `{Y}:{M}` — if a side is zero (or absent) both of its fields render empty, so you get a lone `:`.

**⚠️ Unverified partial cases:** the only real-world example captured has content on both sides of the `>`. The code's no-max/no-min output (`:6>:`, `:>:3`) is internally consistent but has not been tested against the platform. If the platform rejects these, the likely fix is to drop the param entirely when one side is missing and add a second bool param for "no max" / "no min". Capture a URL from the UI with a half-open duration filter to confirm.

## Company domain — intentionally dropped

`bulk_include_company_domain` / `bulk_exclude_company_domain` use the shape `{uuid}::{count}::{comma-space csv}`. The UUID is a **server-generated bulk-list session ID** bound to a real paste action in the UI. Fake UUIDs do not merely fail silently — they **break the entire URL** (platform-confirmed 2026-04-10), preventing any of the other filter panels from loading.

The builder therefore **omits these params entirely**. Instead, `printReviewUrl` emits domain lists as a side-channel `📋 Paste these N domain(s)` note after the URL, so the user can copy them into the platform's paste box manually. All other filters (title, keyword, location, duration, badge, seniority, department, etc.) load correctly from the URL.

**If you capture a URL from the UI where a small (≤5) domain list loads via a non-bulk param** (e.g. `company_include_domain=domain1^domain2`), paste it into the grammar test bench and we can add a code path that uses the non-bulk form for small lists.

## Filters that are intentionally NOT in URL

| FilterOpt      | Why dropped |
| -------------- | ----------- |
| `--geo`        | The platform doesn't expose a geo-radius query param in the URL; it's stored in session state. |
| `--retail-size`| UI doesn't surface this as a filter panel. |
| `--revenue`    | UI doesn't surface this. |
| `--linkedin`   | Direct-profile filters don't have a URL form. |
| `--match-mode` | URL always defaults to SMART; no override exposed. |

The URL is for **review**, not perfect reproduction. Missing filters are silently dropped rather than corrupting the payload.

## Adding new params

When AI Ark ships a new filter panel:

1. Open the UI, set the filter, copy the URL.
2. Decode the new param name and separator.
3. Add a case to `buildSearchUrl()` in `src/url-builder.ts`.
4. Add a row to the table above.
5. Update `FilterOpts` in `src/filters.ts` if the CLI doesn't already expose the flag.
