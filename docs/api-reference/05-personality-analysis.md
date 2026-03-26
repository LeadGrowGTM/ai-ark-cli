# Personality Analysis API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people/analysis`

**Description:** Examines skills, headline, and other publicly available data of a profile, returning a personality analysis based on the profile URL.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Request Body

Profile URL-based request. Submit a LinkedIn profile URL or identifier for personality analysis.

## Response

### 200 Success

Returns personality analysis results based on the profile's publicly available data.

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
