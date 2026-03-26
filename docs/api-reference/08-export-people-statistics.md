# Export People Statistics API

**Endpoint:** `GET https://api.ai-ark.com/api/developer-portal/v1/people/export/{trackId}/inquiries/statistics`

**Description:** Returns export statistics for a given `trackId`. Use this endpoint to poll progress (`statistics.total`, `statistics.found`) and `state` until the job completes.

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
| `trackId` | string | Yes | Identifier from Export People with Email endpoint |

## Response

### 200 Success

Returns export statistics with fields for tracking job completion state and progress metrics.

Key fields:
- `state` - Job state (PENDING, PROCESSING, DONE, FAILED)
- `statistics.total` - Total records being processed
- `statistics.found` - Records with emails found so far

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
