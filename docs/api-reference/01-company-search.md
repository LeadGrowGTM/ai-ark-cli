# AI Ark Company Search API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/companies`

## Request Body

> **IMPORTANT:** Official docs show `{ any: { mode, content } }` but this returns unfiltered results.
> The actual working format is `{ any: { include: { mode, content } } }` — verified 2026-04-02.

```json
{
  "account": {
    "name": {
      "any": {
        "include": { "mode": "SMART", "content": ["Amazon"] }
      }
    },
    "industries": {
      "any": {
        "include": { "mode": "WORD", "content": ["software"] }
      }
    },
    "technologies": {
      "any": {
        "include": { "mode": "WORD", "content": ["react"] }
      }
    }
  },
  "page": 0,
  "size": 10
}
```

## SearchMatchFilter Schema (Verified Working)

Used by: `name`, `industries`, `technologies`, `url`, `productAndServices`, `keyword`

**Field names are PLURAL:** `industries` (not `industry`), `technologies` (not `technology`).

```json
{
  "any": {
    "include": { "mode": "SMART", "content": ["value1", "value2"] },
    "exclude": { "mode": "SMART", "content": ["value3"] }
  },
  "all": {
    "include": { "mode": "STRICT", "content": ["must match"] }
  }
}
```

## FilterWithAllAny (no search match)

Used by: `domain`, `location`, `socialMedia`, `type`, `naics`

```json
{
  "any": { "include": ["value1", "value2"] },
  "all": { "include": ["must match"] }
}
```

## Range Filters

Used by: `employeeSize`, `revenue`, `foundedYear`

```json
{ "all": [[50, 200]] }
```

## Search Modes

- **SMART**: Intelligent/contextual matching
- **WORD**: Individual word matching
- **STRICT**: Exact phrase matching

## Rate Limits

5 requests/second, 300/minute, 18,000/hour
