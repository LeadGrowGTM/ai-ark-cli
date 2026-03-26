# Export People Webhook Payload

**Trigger:** When processing completes for the Export People with Email endpoint, a POST request is sent to your webhook URL with the full results.

## How Webhooks Work

1. Call API endpoint with `webhook` field containing callback URL
2. API responds immediately with `trackId` and `state: "PENDING"`
3. POST request sent to webhook URL with `Content-Type: application/json` upon completion

## Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `trackId` | string | Unique identifier for tracking this request |
| `state` | string | Final state of the job: "DONE" |
| `description` | string \| null | Optional description |
| `statistics` | object | Summary statistics of the results |
| `statistics.total` | integer | Total number of records processed |
| `statistics.found` | integer | Number of records where email was found |
| `data` | array | Array of result items |

## Data Item Schema

### Root Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique person ID |
| `identifier` | string | LinkedIn identifier |
| `industry` | string | Person's industry |
| `last_updated` | string | Last data update date |
| `summary` | object | Person summary info |
| `company` | object | Current company details |
| `department` | object | Department and seniority info |
| `educations` | array | Education history |
| `email` | object | Email finding result |
| `certifications` | array | Professional certifications |
| `languages` | object | Language information |
| `link` | object | Social media links |
| `location` | object | Location details |
| `member_badges` | object | LinkedIn badges (creator, hiring, etc.) |
| `position_groups` | array | Work experience |

### Summary Object

| Field | Type | Description |
|-------|------|-------------|
| `summary.first_name` | string | First name |
| `summary.last_name` | string | Last name |
| `summary.full_name` | string | Full name |
| `summary.headline` | string | LinkedIn headline |
| `summary.title` | string | Current job title |
| `summary.summary` | string \| null | Profile summary text |
| `summary.picture.source` | string | Profile picture URL |

### Company Object

| Field | Type | Description |
|-------|------|-------------|
| `company.id` | string | Unique company ID |
| `company.summary.name` | string | Company name |
| `company.summary.industry` | string | Company industry |
| `company.summary.description` | string | Company description |
| `company.summary.founded_year` | integer | Year founded |
| `company.summary.type` | string | Company type (e.g., "PRIVATELY_HELD") |
| `company.summary.staff.total` | integer | Total employees |
| `company.summary.staff.range` | object | Employee range (start, end) |
| `company.summary.logo.source` | string | Company logo URL |
| `company.link.domain` | string | Company domain |
| `company.link.linkedin` | string | Company LinkedIn URL |
| `company.link.website` | string | Company website |
| `company.location` | object | Headquarter and other locations |
| `company.industries` | array | List of industries |
| `company.languages` | array | Company languages |
| `company.financial` | object | Revenue information |

### Email Object

| Field | Type | Description |
|-------|------|-------------|
| `email.state` | string | Email finding state ("DONE") |
| `email.output` | array | Email results (same schema as Find Emails webhook) |

**Email output item fields:**

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Verification timestamp |
| `domainType` | string | "UNKNOWN", "SMTP", "CATCH_ALL" |
| `found` | boolean | Whether email was found |
| `generic` | boolean | Generic address (e.g., info@) |
| `status` | string | "VALID" or "INVALID" |
| `subStatus` | string | "EMPTY", "MAILBOX_NOT_FOUND", "FAILED_SYNTAX_CHECK" |
| `mx.found` | boolean | MX records discovered |
| `mx.google` | boolean | Domain uses Google |
| `mx.provider` | string \| null | Email provider |
| `mx.record` | string \| null | MX record value |

### Department Object

| Field | Type | Description |
|-------|------|-------------|
| `department.seniority` | string | Seniority level (founder, senior, manager, etc.) |
| `department.departments` | array | Department names |
| `department.functions` | array | Job functions |
| `department.sub_departments` | array | Sub-department names |

### Certifications Array Item

| Field | Type | Description |
|-------|------|-------------|
| `authority` | string | Issuing authority |
| `company` | object | Company that issued certification (id, name, logo, url) |
| `date` | object | Start and end dates |
| `display_source` | string | Source URL display text |
| `license_number` | string | License/certificate number |
| `name` | string | Certification name |
| `url` | string | Certificate URL |

### Member Badges

| Field | Type | Description |
|-------|------|-------------|
| `member_badges.creator` | boolean | LinkedIn creator badge |
| `member_badges.hiring` | boolean | Hiring badge |
| `member_badges.open_to_work` | boolean | Open to work badge |
| `member_badges.premium` | boolean | LinkedIn Premium badge |

## Example Payload

```json
{
  "trackId": "1cf8e1d1-a597-43a9-a9aa-27ad3d905b28",
  "state": "DONE",
  "description": null,
  "statistics": {
    "found": 4,
    "total": 10
  },
  "data": [
    {
      "id": "aa38439b-af6c-028e-06e2-f981b2ea0cc3",
      "identifier": "riya-anto-k-184b84b9",
      "industry": "Human Resources",
      "last_updated": "2026-02-14",
      "summary": {
        "first_name": "Riya",
        "last_name": "Anto K",
        "full_name": "Riya Anto K",
        "headline": "Assistant General Manager Human Resources",
        "title": "Assistant General Manager Human Resources at Pandhal Global Gourmet PVT LTD",
        "picture": {
          "source": "https://images.ai-ark.com/..."
        }
      },
      "company": {
        "id": "8c1de115-4cb2-fc3d-8658-4db9267528a5",
        "summary": {
          "name": "Pandhal Global Gourmet PVT LTD",
          "industry": "food and beverage services",
          "founded_year": 1984,
          "type": "PRIVATELY_HELD",
          "staff": {
            "total": 63,
            "range": { "start": 1001, "end": 5000 }
          },
          "logo": { "source": "https://images.ai-ark.com/..." }
        },
        "link": {
          "domain": "pandhal.in",
          "linkedin": "https://www.linkedin.com/company/pandhal-global-gourmet-pvt-ltd",
          "website": "https://www.pandhal.in"
        },
        "industries": ["food and beverage services"],
        "languages": ["english"],
        "financial": {
          "revenue": {
            "annual": { "amount": "100000-500000", "start": 100000, "end": 500000 }
          }
        },
        "location": {
          "headquarter": {
            "city": "Ernakulam",
            "country": "India",
            "state": "Kerala",
            "continent": "Asia"
          }
        }
      },
      "department": {
        "seniority": "senior",
        "departments": ["master_human_resources"],
        "functions": ["human_resources"],
        "sub_departments": ["human_resources"]
      },
      "email": {
        "state": "DONE",
        "output": [
          {
            "date": "2026-03-06T12:21:32.000523",
            "domainType": "UNKNOWN",
            "found": false,
            "generic": false,
            "status": "INVALID",
            "subStatus": "MAILBOX_NOT_FOUND",
            "mx": { "found": false, "google": false, "provider": null, "record": null }
          }
        ]
      },
      "certifications": [
        {
          "name": "Emotional Intelligence Trainer and Coach Programme",
          "authority": "Protouch",
          "license_number": "110535288",
          "display_source": "protouchpro.com",
          "url": "https://certificates.protouchpro.com/...",
          "company": { "id": "34167af6-f1c7-c088-6459-68e7342f5062", "name": "Protouch" },
          "date": { "start": "2024-07-01", "end": null }
        }
      ],
      "location": {
        "default": "Kochi, Kerala, India, Asia",
        "short": "Kochi, Kerala",
        "city": "Kochi",
        "country": "India",
        "state": "Kerala"
      },
      "link": {
        "linkedin": "https://www.linkedin.com/in/riya-anto-k-184b84b9",
        "facebook": null,
        "twitter": null,
        "github": null
      },
      "languages": {
        "primary_locale": { "country": "US", "language": "en" },
        "supported_locales": [{ "country": "US", "language": "en" }]
      },
      "member_badges": {
        "creator": true,
        "hiring": true,
        "open_to_work": false,
        "premium": false
      },
      "educations": [
        {
          "degree_name": "Advanced Human Resources Management for HR Leaders",
          "field_of_study": "Human Resources Development",
          "grade": "Completed",
          "date": { "start": "2023-06-01", "end": "2024-06-30" },
          "school": {
            "id": "691b4862-ab2e-3772-26f0-7f2e71b3ae14",
            "name": "Indian Institute of Management, Indore",
            "url": "https://www.linkedin.com/school/iimindore",
            "logo": "https://images.ai-ark.com/..."
          }
        }
      ],
      "position_groups": [
        {
          "company": {
            "id": "8c1de115-4cb2-fc3d-8658-4db9267528a5",
            "name": "Pandhal Global Gourmet PVT LTD",
            "url": "https://www.linkedin.com/company/pandhal-global-gourmet-pvt-ltd",
            "employees": { "start": 1001, "end": 5000 }
          },
          "date": { "start": "2021-09-01", "end": null },
          "profile_positions": [
            {
              "title": "Assistant General Manager Human Resources",
              "company": "Pandhal Global Gourmet PVT LTD",
              "employment_type": "Full-time",
              "location": "Kochi, Kerala, India",
              "date": { "start": "2024-09-01", "end": null }
            }
          ]
        }
      ]
    }
  ]
}
```

## Best Practices

- Use HTTPS for your webhook URL to ensure data is encrypted in transit
- Respond quickly with a 200 OK status. Process the data asynchronously on your side
- Store the trackId from the initial API response to match it with the webhook callback
- Handle duplicates. In rare cases, a webhook may be delivered more than once
- Automatic retries: up to 30 times. Use Resend Webhook endpoint if needed
