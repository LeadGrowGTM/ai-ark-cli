# Find Emails Webhook Payload

**Trigger:** When processing completes for the Find Emails by Track ID endpoint, a POST request is sent to your webhook URL with the full results.

## How Webhooks Work

1. Call API endpoint with `webhook` field containing callback URL
2. API responds immediately with `trackId` and `state: "PENDING"`
3. POST request sent to webhook URL with `Content-Type: application/json` upon completion

## Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `trackId` | string | Unique identifier for tracking this request |
| `state` | string | Final state: "DONE" |
| `description` | string \| null | Optional description |
| `statistics` | object | Summary statistics |
| `statistics.total` | integer | Total number of records |
| `statistics.found` | integer | Records where email was found |
| `data` | array | Array of result items |

## Data Item Schema

| Field | Type | Description |
|-------|------|-------------|
| `refId` | string | Unique reference ID for this record |
| `state` | string | Individual record state: "DONE" |
| `input` | object | Search parameters |
| `input.firstname` | string | Person's first name |
| `input.lastname` | string | Person's last name |
| `input.domain` | string | Company domain for search |
| `output` | array | Email finding results |

## Output Item Schema

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Discovered email (present only when `found: true`) |
| `date` | string | Verification timestamp (ISO 8601) |
| `domainType` | string | "SMTP", "CATCH_ALL", or "UNKNOWN" |
| `found` | boolean | Whether email was found |
| `free` | boolean | Free provider email |
| `generic` | boolean | Generic address (e.g., info@) |
| `status` | string | "VALID" or "INVALID" |
| `subStatus` | string | "EMPTY", "MAILBOX_NOT_FOUND", or "FAILED_SYNTAX_CHECK" |
| `mx` | object | MX record details |
| `mx.found` | boolean | MX records discovered |
| `mx.google` | boolean | Domain uses Google |
| `mx.provider` | string \| null | "microsoft", "g-suite", "mimecast", "barracuda", "proofpoint", "cisco ironport", "other", or null |
| `mx.record` | string \| null | MX record value |

## Example: Email Found

```json
{
  "trackId": "1c83c619-8d23-4922-8b81-ad27bf78d2b2",
  "state": "DONE",
  "description": null,
  "statistics": {
    "found": 56,
    "total": 100
  },
  "data": [
    {
      "refId": "d56aea1a-6b59-2cae-68f2-95952067dbca",
      "state": "DONE",
      "input": {
        "firstname": "Rogerio",
        "lastname": "Verissimo",
        "domain": "estrelabet.com"
      },
      "output": [
        {
          "address": "rogerio.verissimo@estrelabet.com",
          "date": "2026-03-06T14:41:53.000474",
          "domainType": "SMTP",
          "found": true,
          "free": true,
          "generic": false,
          "status": "VALID",
          "subStatus": "EMPTY",
          "mx": {
            "found": false,
            "google": false,
            "provider": null,
            "record": null
          }
        }
      ]
    }
  ]
}
```

## Example: Email Not Found

```json
{
  "trackId": "1c83c619-8d23-4922-8b81-ad27bf78d2b2",
  "state": "DONE",
  "description": null,
  "statistics": {
    "found": 56,
    "total": 100
  },
  "data": [
    {
      "refId": "aaa4fb3e-04cf-711a-8e6c-9a8d546240ba",
      "state": "DONE",
      "input": {
        "firstname": "Rinoy",
        "lastname": "J Vincent",
        "domain": "bizstaffingcomrade.com"
      },
      "output": [
        {
          "date": "2026-03-06T14:46:40.000145",
          "domainType": "UNKNOWN",
          "found": false,
          "generic": false,
          "status": "INVALID",
          "subStatus": "MAILBOX_NOT_FOUND",
          "mx": {
            "found": false,
            "google": false,
            "provider": null,
            "record": null
          }
        }
      ]
    }
  ]
}
```

## Best Practices

- Use HTTPS for your webhook URL to ensure data is encrypted in transit
- Respond quickly with a 200 OK status. Process the data asynchronously
- Store the trackId from the initial API response to match it with the webhook callback
- Handle duplicates. In rare cases, a webhook may be delivered more than once
- Automatic retries: up to 30 times. Use Resend Email Finder Webhook endpoint if needed
