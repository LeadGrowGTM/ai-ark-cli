# Fetch Your Credit API

**Endpoint:** `GET https://api.ai-ark.com/api/developer-portal/v1/payments/credits`

**Description:** Retrieves the number of remaining credits in your account.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Parameters

No request body parameters. GET request only.

## Response

### 200 Success

Returns account credit information (remaining credits count).

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
