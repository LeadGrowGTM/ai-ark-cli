# Mobile Phone Finder API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people/mobile-phone-finder`

**Description:** Locates phone numbers for individuals using flexible search criteria. Offers three distinct search pathways: LinkedIn URL only, domain plus name combination, or type specification for phone number discovery.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Search Options

| Pathway | Required Fields | Notes |
|---------|----------------|-------|
| LinkedIn Search | LinkedIn URL only | Domain/name not required |
| Domain + Name Search | Both domain and name | LinkedIn not required |
| Type | Always required | Specifies phone number category |

## Request Body

Accepts same account and contact filter structure as People Search API:

- Account filters (domain, LinkedIn, URL, name, phone, industries, location, etc.)
- Contact filters (profile, professional, skills, education)
- Pagination (page, size)

## Response

### 200 Success

Returns matching phone number records in JSON format.

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
