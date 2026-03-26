# Export People with Email API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people/export`

**Description:** Facilitates asynchronous export of individuals matching specified filters, including email discovery. Processes requests asynchronously and delivers results via webhook notification upon completion.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Key Constraints

- **Maximum results per export:** 10,000 people (size parameter capped at 10,000)
- **Error on exceeding limit:** Returns `400 Bad Request - pagination limit exceeded`
- **Email verification:** All returned emails are verified in real time by BounceBan
- **Webhook retries:** Automatic retry up to 30 times; manual re-trigger available via resend endpoint

## Request Body

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `page` | integer | Zero-based page number |
| `size` | integer | Results per page (0-10,000 maximum) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `webhook` | string | URL to receive POST notification upon completion |

### Account Filters

Same structure as People Search API:

- `domain`, `linkedin`, `url`, `name`, `socialMediaLink`, `phoneNumber`
- `industries`, `location`, `productAndServices`, `socialMedia`, `type`
- `foundedYear`, `employeeSize`, `revenue`, `language`, `geoLocation`
- `keyword`, `funding`, `metric`, `technology`, `technologies`, `naics`

### Contact Filters

Same structure as People Search API (profile, professional, skills, education).

## Response

### 200 Success

```json
{
  "trackId": "string",
  "state": "PENDING",
  "statistics": {
    "total": 0,
    "success": 0,
    "failed": 0,
    "found": 0
  }
}
```

**State values:** `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

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

1. Submit export request with optional webhook URL
2. Receive `trackId` and `state: "PENDING"` immediately
3. Poll via Export People Statistics endpoint OR wait for webhook
4. Retrieve results via Export People Results endpoint

## Related Endpoints

- `GET /people/export/{trackId}/inquiries` - Get results
- `GET /people/export/{trackId}/inquiries/statistics` - Poll progress
- `PATCH /people/export/{trackId}/inquiries/notify` - Resend webhook
