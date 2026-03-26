# Export People Results API

**Endpoint:** `GET https://api.ai-ark.com/api/developer-portal/v1/people/export/{trackId}/inquiries`

**Description:** Returns paginated export results for a given `trackId`. The `trackId` is from the Export People with Email response.

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
| `trackId` | string | Yes | Identifier from Export People with Email response |

### Query Parameters

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `page` | integer | No | 0 | Zero-based page number |
| `size` | integer | No | 10 | Items per page (0-100) |

## Response

### 200 Success

Returns paginated results containing people data with nested objects for email, company, and profile information.

During processing: `email.state` = `PROCESSING`, `email.output` = empty array.
Upon completion: `email.state` = `DONE`, `email.output` contains found emails.

### 409 Conflict

Track ID still processing.

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
