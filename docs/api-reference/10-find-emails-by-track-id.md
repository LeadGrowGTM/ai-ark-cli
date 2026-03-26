# Find Emails by Track ID API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people/email-finder`

**Description:** Retrieves or triggers email finding for a people search result using the `trackId` returned in the People Search API response.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Key Constraints

- Each `trackId` can only be used **once**; after the first request, it is consumed
- `trackId` expires **6 hours** after the original people search response
- All emails returned are verified in real time by BounceBan

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trackId` | string | Yes | Tracking identifier from People Search API response |
| `webhook` | string | No | Webhook URL for async completion notifications |

## Response

### 200 Success

```json
{
  "statistics": {
    "total": 100,
    "found": 0
  },
  "state": "PENDING"
}
```

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```

## Async Workflow

1. Get `trackId` from People Search API response
2. Submit to this endpoint with optional webhook
3. Poll via Email Finder Statistics endpoint OR wait for webhook
4. Retrieve results via Email Finder Results endpoint

## Webhook Details

- Automatic retry delivery up to 30 times
- Use Resend Email Finder Webhook endpoint to re-trigger if needed

## Related Endpoints

- `GET /people/email-finder/{trackId}/statistics` - Poll progress
- `GET /people/email-finder/{trackId}/inquiries` - Get results
- `PATCH /people/email-finder/{trackId}/notify` - Resend webhook
