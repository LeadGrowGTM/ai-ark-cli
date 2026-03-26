# Email Finder Results API

**Endpoint:** `GET https://api.ai-ark.com/api/developer-portal/v1/people/email-finder/{trackId}/inquiries`

**Description:** Returns paginated email finder results for a given `trackId`. Use `page` and `size` query parameters to paginate through results.

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
| `trackId` | string | Yes | Identifier from Find Emails by Track ID response |

### Query Parameters

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `page` | integer | No | 0 | - | Zero-based page number |
| `size` | integer | No | 10 | Min: 0, Max: 100 | Items per page |

## Response

### 200 Success

Paginated response with email finder results. Each result item includes:

- `refId` - Unique reference ID
- `state` - Individual record state ("DONE")
- `input` - Search parameters (firstname, lastname, domain)
- `output` - Email results with verification details

Pagination fields: `pageNumber`, `pageSize`, `totalElements`, `totalPages`

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
