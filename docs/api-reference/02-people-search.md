# AI Ark People Search API

**Endpoint:** `POST https://api.ai-ark.com/api/developer-portal/v1/people`

## Request Body

```json
{
  "contact": {
    "fullName": {
      "any": {
        "include": {
          "mode": "SMART",
          "content": ["David Bowie"]
        },
        "exclude": {
          "mode": "SMART",
          "content": ["Roger Waters"]
        }
      }
    },
    "experience": {
      "current": {
        "title": {
          "any": {
            "include": {
              "mode": "SMART",
              "content": ["founder"]
            },
            "exclude": {
              "mode": "SMART",
              "content": ["senior"]
            }
          }
        },
        "duration": {
          "currentJob": {
            "min": { "year": 1, "month": 0 },
            "max": { "year": 3, "month": 6 }
          }
        }
      }
    },
    "skill": {
      "any": {
        "include": {
          "mode": "SMART",
          "content": ["leadership"]
        },
        "exclude": {
          "mode": "SMART",
          "content": ["sales"]
        }
      }
    }
  },
  "page": 0,
  "size": 10
}
```

## SearchMatch Filter Structure (People)

Used by: `fullName`, `experience.*.title`, `skill`, `certification`, `language`, `education.degree`, `education.fieldOfStudy`

```json
{
  "any": {
    "include": {
      "mode": "SMART|WORD|STRICT",
      "content": ["value1", "value2"]
    },
    "exclude": {
      "mode": "SMART|WORD|STRICT",
      "content": ["value3"]
    }
  },
  "all": {
    "include": {
      "mode": "SMART|WORD|STRICT",
      "content": ["value4"]
    }
  }
}
```

## Account Filters (in People Search)

Company-level filters use the SAME SearchMatchFilter structure:
- `account.name`: `{ any: { include: { mode: "SMART", content: ["Company"] } } }`
- `account.industries`: `{ any: { include: { mode: "WORD", content: ["SaaS"] } } }`
- `account.technologies`: `{ any: { include: { mode: "WORD", content: ["React"] } } }`

**Field names are PLURAL:** `industries`, `technologies` (not singular).

## Contact Filters With SearchMatch

- `fullName`
- `experience.current.title`
- `experience.latest.title`
- `experience.previous.title`
- `skill`
- `certification`
- `language`
- `education.degree`
- `education.fieldOfStudy`

## FilterWithAllAny (no search match — existing working filters)

Used by: `domain`, `seniority`, `departmentAndFunction`, `location`

```json
{
  "any": {
    "include": ["value1"],
    "exclude": ["value2"]
  }
}
```

## Rate Limits

5 requests/second, 300/minute, 18,000/hour

## Required Fields

- `page`: integer (zero-based)
- `size`: integer (0-100, default 10)
