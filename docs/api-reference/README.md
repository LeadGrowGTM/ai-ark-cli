# AI Ark API Reference

Complete API documentation scraped from [docs.ai-ark.com](https://docs.ai-ark.com) on 2026-03-26.

## Base URL

```
https://api.ai-ark.com/api/developer-portal/v1
```

## Authentication

All endpoints require header-based authentication with `Content-Type: application/json`.

API keys are managed at: https://app.ai-ark.com/settings/api-management/dashboard

## Global Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Endpoints

### Core Search

| # | Endpoint | Method | Path | Description |
|---|----------|--------|------|-------------|
| 01 | [Company Search](01-company-search.md) | POST | `/companies` | Search 69M+ company profiles |
| 02 | [People Search](02-people-search.md) | POST | `/people` | Search 400M+ people profiles |
| 03 | [Reverse People Lookup](03-reverse-people-lookup.md) | POST | `/people/reverse-lookup` | Find people by email/phone |
| 04 | [Mobile Phone Finder](04-mobile-phone-finder.md) | POST | `/people/mobile-phone-finder` | Find phone numbers by LinkedIn/domain+name |
| 05 | [Personality Analysis](05-personality-analysis.md) | POST | `/people/analysis` | AI personality analysis from LinkedIn profile |

### Export People (Async with Email)

| # | Endpoint | Method | Path | Description |
|---|----------|--------|------|-------------|
| 06 | [Export People with Email](06-export-people-with-email.md) | POST | `/people/export` | Async bulk export with email discovery (max 10K) |
| 07 | [Export People Results](07-export-people-results.md) | GET | `/people/export/{trackId}/inquiries` | Get paginated export results |
| 08 | [Export People Statistics](08-export-people-statistics.md) | GET | `/people/export/{trackId}/inquiries/statistics` | Poll export job progress |
| 09 | [Resend Export Webhook](09-resend-export-people-webhook.md) | PATCH | `/people/export/{trackId}/inquiries/notify` | Re-trigger export webhook |

### Email Finder (Async)

| # | Endpoint | Method | Path | Description |
|---|----------|--------|------|-------------|
| 10 | [Find Emails by Track ID](10-find-emails-by-track-id.md) | POST | `/people/email-finder` | Trigger email finding from people search trackId |
| 11 | [Email Finder Statistics](11-email-finder-statistics.md) | GET | `/people/email-finder/{trackId}/statistics` | Poll email finder progress |
| 12 | [Email Finder Results](12-email-finder-results.md) | GET | `/people/email-finder/{trackId}/inquiries` | Get paginated email finder results |
| 13 | [Resend Email Finder Webhook](13-resend-email-finder-webhook.md) | PATCH | `/people/email-finder/{trackId}/notify` | Re-trigger email finder webhook |

### Account

| # | Endpoint | Method | Path | Description |
|---|----------|--------|------|-------------|
| 14 | [Fetch Credit](14-fetch-credit.md) | GET | `/payments/credits` | Check remaining account credits |

### Webhooks

| # | Doc | Description |
|---|-----|-------------|
| 15 | [Export People Webhook](15-webhook-export-people.md) | Webhook payload for export people completion |
| 16 | [Find Emails Webhook](16-webhook-find-emails.md) | Webhook payload for email finder completion |

### MCP

| # | Doc | Description |
|---|-----|-------------|
| 17 | [MCP Server](17-mcp-server.md) | MCP server setup for AI editors (Cursor, Windsurf, Claude Desktop) |

## Key Concepts

### Async Workflows

Two main async patterns:

**Export People Flow:**
1. `POST /people/export` (with optional webhook) -> get `trackId`
2. Poll `GET /people/export/{trackId}/inquiries/statistics` until `state: "DONE"`
3. Fetch `GET /people/export/{trackId}/inquiries` for results

**Email Finder Flow:**
1. `POST /people` -> get `trackId` in response
2. `POST /people/email-finder` with `trackId` -> triggers email finding
3. Poll `GET /people/email-finder/{trackId}/statistics` until `state: "DONE"`
4. Fetch `GET /people/email-finder/{trackId}/inquiries` for results

**Note:** Email finder `trackId` can only be used once and expires after 6 hours.

### Filter Types

Common filter patterns used across endpoints:

- `FilterWithAllAny` - include/exclude arrays
- `FilterWithAllAnyPlusSearchMatch` - include/exclude + search mode (SMART/WORD/STRICT)
- `RangeWithType` - numeric range arrays
- Enum filters for predefined values (industries, company types, social media platforms)
