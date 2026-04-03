# AI Ark People Reverse Lookup API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people/reverse-lookup`

## Request Body

```json
{
  "search": "email@example.com"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | Yes | Email address, phone number, or other contact info |

## Auth

Header: `X-TOKEN: {api-key}`

## Response (200)

Returns full person profile with:
- `id`, `identifier`
- `profile`: first_name, last_name, full_name, headline, title, picture, summary
- `link`: linkedin, twitter, github, facebook
- `location`: country, state, city, position
- `languages`: primary_locale, supported_locales, profile_languages
- `industry`
- `educations[]`: school, degree_name, field_of_study, date
- `certifications[]`: name, authority, company, date
- `position_groups[]`: company (with employees range), profile_positions[]
- `skills[]`: string array
- `member_badges`: creator, hiring, open_to_work, premium
- `company`: full company object with summary, link, financial, location, technologies[], industries[]
- `department`: departments[], sub_departments[], functions[], seniority

## Response (404)

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```

## Rate Limits

5 requests/second, 300/minute, 18,000/hour
