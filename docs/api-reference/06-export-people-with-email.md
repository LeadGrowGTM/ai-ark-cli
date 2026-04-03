# AI Ark People Export with Email API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people/export`

Async endpoint. Same filters as People Search. All emails verified by BounceBan.

## Request Body

```json
{
  "account": {
    "employeeSize": {
      "type": "RANGE",
      "range": [{ "start": 10, "end": 50 }]
    }
  },
  "page": 0,
  "size": 25,
  "webhook": "https://your-webhook-url.com"
}
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account` | AccountFilter | No | Company-level filters |
| `contact` | ContactFilter | No | Contact-level filters |
| `page` | integer | Yes | Page number (zero-based) |
| `size` | integer | Yes | 1-10000 (max with email) |
| `webhook` | string (URI) | Yes | Webhook URL for async results |

## Filters

Uses SAME filter structure as People Search:

**Account filters (SearchMatch):** name, url, industries, technologies, keyword, productAndServices
```json
{ "any": { "mode": "SMART", "content": ["value"] } }
```

**Account filters (AllAny):** domain, location, employeeSize, revenue, type, etc.
```json
{ "any": { "include": ["value"] } }
```

**Contact filters (SearchMatch):** fullName, experience.*.title, skill, certification
```json
{ "any": { "include": { "mode": "SMART", "content": ["value"] } } }
```

**Contact filters (AllAny):** seniority, departmentAndFunction, location
```json
{ "any": { "include": ["value"] } }
```

## Contact Filter Properties

- **fullName**: Person's full name (SMART/WORD/STRICT)
- **experience**: current/latest/previous with title + duration
- **seniority**: founder, owner, partner, c_suite, vp, director, head, manager, senior, mid-level, entry, intern
- **departmentAndFunction**: Department classification
- **skill**: Professional skills (SMART/WORD/STRICT)
- **certification**: Professional certifications
- **profileBadge**: CREATOR, HIRING, INFLUENCER, OPEN_TO_WORK, PAID_SOCIAL_MEMBERS
- **education**: school, degree, fieldOfStudy, graduationDate range

## Response (200)

```json
{
  "trackId": "87dad120-e371-44e0-b896-cf90b2f84170",
  "statistics": { "total": 25, "found": 0 },
  "webhook": { "state": "PENDING", "retry": null },
  "state": "PENDING",
  "description": null
}
```

## Webhook

Results POSTed to webhook URL. Auto-retry up to 3 times.

## Rate Limits

5 requests/second, 300/minute, 18,000/hour
