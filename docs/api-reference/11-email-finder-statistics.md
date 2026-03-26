# Email Finder Statistics API

**Endpoint:** `GET https://api.ai-ark.com/api/developer-portal/v1/people/email-finder/{trackId}/statistics`

**Description:** Returns email-finding statistics for a given `trackId`. Use this endpoint to poll progress (`statistics.total`, `statistics.found`) and `state` until the job completes.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Parameters

### Path Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trackId` | string | Yes | Identifier from Find Emails by Track ID endpoint |

## Response

### 200 Success

Returns statistics object containing email-finding job progress metrics:

- `state` - Job state (PENDING, PROCESSING, DONE, FAILED)
- `statistics.total` - Total records
- `statistics.found` - Emails found so far

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
