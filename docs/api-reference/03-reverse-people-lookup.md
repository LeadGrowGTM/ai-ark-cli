# Reverse People Lookup API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people/reverse-lookup`

**Description:** Searches for individuals using contact information such as email addresses or phone numbers.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Search type specification (e.g., "CONTACT") |
| `search` | string | Yes | The contact information to search for (email address or phone number) |

## Example Request

```json
{
  "kind": "CONTACT",
  "search": "john@example.com"
}
```

## Response

### 200 Success

Returns matching person records based on the contact lookup criteria provided.

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
