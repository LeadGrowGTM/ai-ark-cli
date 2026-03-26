# Company Search API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/companies`

**Description:** Searches for companies based on account filters across more than 69 million enriched, verified, and active company profiles.

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
| `page` | integer | Zero-based page number |
| `size` | integer | Items per page (0-100 max) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `lookalikeDomains` | array | Up to 5 domain/LinkedIn URLs for similar company discovery |
| `account` | object | Complex filter object (see below) |

### Account Filter Object

#### Company Identification

| Field | Type | Description |
|-------|------|-------------|
| `account.domain` | FilterWithAllAny | Company domain include/exclude arrays |
| `account.linkedin` | FilterWithAllAny | LinkedIn URL include/exclude arrays |
| `account.url` | FilterWithAllAnyPlusSearchMatch | Supports domain, www, full URL, LinkedIn company URL |
| `account.name` | FilterWithAllAnyPlusSearchMatch | Company name search |
| `account.socialMediaLink` | FilterWithAllAny | Social media identifiers |
| `account.phoneNumber` | FilterWithAllAny | Contact numbers |

#### Company Details

| Field | Type | Description |
|-------|------|-------------|
| `account.industries` | FilterWithAllAnyPlusSearchMatchForIndustry | Industry values with SMART/WORD/STRICT matching modes |
| `account.location` | FilterWithAllAny | Geographic location filters |
| `account.productAndServices` | FilterWithAllAnyPlusSearchMatch | Offerings with search mode options |
| `account.socialMedia` | FilterWithAllAnyEnumForSocialMedia | FACEBOOK, INSTAGRAM, TWITTER, LINKEDIN |
| `account.type` | FilterWithAllAnyEnumForCompanyType | PRIVATELY_HELD, PUBLIC_COMPANY, NON_PROFIT, etc. |
| `account.foundedYear` | FoundedYearWithType | Range-based filter |
| `account.language` | FilterWithAllAnyAndRangeEnumForLanguage | Language options with range support |
| `account.geoLocation` | object | position (lat/lng) with radius and unit (km/mi) |

#### Financial & Size

| Field | Type | Description |
|-------|------|-------------|
| `account.employeeSize` | RangeWithType | Range arrays for employee count |
| `account.revenue` | RevenueWithType | Range-based revenue amounts |
| `account.funding` | object | type array, totalAmount, lastAmount, duration ranges |

#### Advanced Filters

| Field | Type | Description |
|-------|------|-------------|
| `account.keyword` | FilterWithAllAnyCompanyKeywords | Advanced search with sources and content |
| `account.metric` | CompanyMetrics | Employee counts and growth by function/timeframe |
| `account.technologies` | FilterWithAllAnyPlusSearchMatch | Technology stack filtering |
| `account.naics` | FilterWithAllAny | NAICS industry classification codes |

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

Response contains paginated company results including: ID, name, description, founded year, staff counts, locations, technologies, industries, keywords, contact info, and financial details.

### 404 Not Found

```json
{
  "timestamp": "2025-10-14T13:27:32.210+00:00",
  "status": 404,
  "error": "data not found",
  "path": ""
}
```
