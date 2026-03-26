# People Search API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people`

**Description:** Searches for individuals based on account and/or contact filters across more than 400 million enriched, verified, and active profiles.

## Rate Limits

- 5 requests per second
- 300 per minute
- 18,000 per hour

## Authentication

Header-based authentication required.

**Required Header:** `Content-Type: application/json`

## Request Body

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `page` | integer | Zero-based page number (default: 0) |
| `size` | integer | Items per page, 0-100 max (default: 10) |

### Account Filter Object

Same as Company Search API. Includes:

- `domain` - company domain with include/exclude arrays
- `linkedin` - LinkedIn URL with include/exclude arrays
- `url` - supports multiple formats (domain, www, full URL, LinkedIn company URL)
- `name` - company name search
- `socialMediaLink` - social media identifiers
- `phoneNumber` - contact numbers
- `industries` - enumerated industry values with SMART/WORD/STRICT matching modes
- `location` - geographic location filters
- `productAndServices` - offerings with search mode options
- `socialMedia` - FACEBOOK, INSTAGRAM, TWITTER, LINKEDIN
- `type` - company types (PRIVATELY_HELD, PUBLIC_COMPANY, NON_PROFIT, etc.)
- `foundedYear` - range-based filter
- `employeeSize` - range arrays
- `revenue` - range-based amounts
- `language` - enumerated language options with range support
- `geoLocation` - position (lat/lng) with radius and unit (km/mi)
- `keyword` - advanced search with sources and content
- `funding` - type array, totalAmount, lastAmount, duration ranges
- `metric` - employee counts and growth by function/timeframe
- `technologies` - technology stack filtering
- `naics` - industry classification codes

### Contact Filter Categories

#### Profile

- Full Name
- Social Media Link
- LinkedIn
- Location
- Language Skills
- Profile Badge

#### Professional

- Current & Past Company
- Seniority
- Department and Function
- Experience (Current/Previous Title, Duration)

#### Skills & Education

- Skills
- Certifications
- Education (School, Degree, Field of Study, Date)
- Keywords
- Social Media

## Response

### 200 Success

```json
{
  "content": [...],
  "pageable": {...},
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true,
  "empty": false
}
```

Returns paginated results with profile objects including full person data.

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
