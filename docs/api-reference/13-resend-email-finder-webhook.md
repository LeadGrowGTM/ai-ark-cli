# Resend Email Finder Webhook API

**Endpoint:** `PATCH https://api.ai-ark.com/api/developer-portal/v1/people/email-finder/{trackId}/notify`

**Description:** Resends the webhook notification for a given `trackId` to the specified `webhook` URL. Use this when the initial webhook delivery failed or you need to trigger a new notification to a different URL.

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
| `trackId` | string | Yes | Tracking ID for the email finder operation |

### Request Body

Contains the webhook URL to resend the notification to.

## Response

### 200 Success

Returns confirmation object.

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
