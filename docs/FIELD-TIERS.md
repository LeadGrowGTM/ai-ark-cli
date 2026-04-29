# AI Ark Field Tiers

Score each field: **1** (GTM gold — keep always), **2** (research-useful — keep for deep work), **3** (noise/junk — never persist)

Tier 3 candidates: fields that are always null, always the same value, expire (S3 URLs), or are pagination metadata with zero business value.

---

## Tier Definitions

| Tier | Meaning | Profile that keeps it |
|------|---------|------------------------|
| 1    | GTM gold — drives cold email + sales outreach | `--profile outbound` (default) |
| 2    | Research-useful — keep for deep work | `--profile raw` only |
| 3    | Noise — expiring URLs, always-null, duplicates | `--profile raw` only (raw is byte-equal to API; Tier 3 means "don't use for outbound") |

`--profile raw` returns the API response unchanged. Tier values in this doc describe field VALUE, not what the CLI strips.
`--profile outbound` keeps ONLY Tier 1 fields, restructured into a flat shape (see `src/io/tier-filter.ts`).

---

## Person Fields


| Field Path                                              | Example Value                                                           | Notes                                       | Tier |
| ------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- | ---- |
| `id`                                                    | `"18d20042-3d11-030a-c4c1-21c45c5cb821"`                                | AI Ark internal UUID                        | 2    |
| `identifier`                                            | `"dan-claps-cfe-ceo-of-voda-0036b9a2"`                                  | LinkedIn slug                               | 2    |
| `profile.first_name`                                    | `"Dan"`                                                                 |                                             | 1    |
| `profile.last_name`                                     | `"Claps, CFE (CEO of VODA...)"`                                         | Raw from LinkedIn — often has junk appended | 1    |
| `profile.full_name`                                     | `"Dan Claps, CFE (CEO of VODA Cleaning and Restoration)"`               | Same junk problem                           | 1    |
| `profile.headline`                                      | `"CEO of Voda Cleaning and Restoration"`                                | Cleaner than full_name                      | 1    |
| `profile.title`                                         | `"Chief Executive Officer & Co-Founder"`                                | Current role title                          | 1    |
| `profile.picture.source`                                | `"https://images.ai-ark.com/...exp:1777679999..."`                      | **Expires — CDN signed URL**                | 3    |
| `profile.background.source`                             | `"https://media.licdn.com/dms/image/..."`                               | LinkedIn banner image                       | 3    |
| `profile.birth_date`                                    | `null`                                                                  | Almost always null                          | 3    |
| `profile.summary`                                       | `"Dan Claps is an accomplished entrepreneur..."`                        | AI-generated bio from LinkedIn              | 1    |
| `link.linkedin`                                         | `"https://www.linkedin.com/in/dan-claps-..."`                           |                                             | 1    |
| `link.twitter`                                          | `null`                                                                  | Usually null                                | 3    |
| `link.github`                                           | `null`                                                                  | Usually null                                | 3    |
| `link.facebook`                                         | `null`                                                                  | Usually null                                | 3    |
| `location.country`                                      | `"United States"`                                                       |                                             | 1    |
| `location.state`                                        | `"New York"`                                                            |                                             | 1    |
| `location.city`                                         | `"New York"`                                                            |                                             | 1    |
| `location.position`                                     | `null`                                                                  | Lat/lng — usually null                      | 3    |
| `location.default`                                      | `"New York, New York, United States, North America"`                    | Long-form string duplicate                  | 3    |
| `location.short`                                        | `"New York, New York"`                                                  | Cleaner short version                       | 2    |
| `languages.primary_locale`                              | `{"country": "US", "language": "en"}`                                   | Almost always en-US                         | 3    |
| `languages.supported_locales`                           | `[{"country": "US", "language": "en"}]`                                 | Almost always just en-US                    | 3    |
| `languages.profile_languages`                           | `null`                                                                  | Almost always null                          | 3    |
| `industry`                                              | `"Consumer Services"`                                                   | Person's stated industry                    | 1    |
| `educations[].school.name`                              | `"South Brunswick High School"`                                         |                                             | 2    |
| `educations[].degree_name`                              | `null`                                                                  | Often null                                  | 2    |
| `educations[].field_of_study`                           | `"High School"`                                                         |                                             | 2    |
| `educations[].date.start/end`                           | `null`                                                                  | Often null                                  | 2    |
| `certifications[].name`                                 | `"Certified Franchise Executive (CFE)"`                                 |                                             | 2    |
| `certifications[].authority`                            | `"International Franchise Association"`                                 |                                             | 2    |
| `certifications[].date`                                 | `{"start": "2022-12-01", "end": null}`                                  |                                             | 2    |
| `organizations[].name`                                  | `"BNI"`                                                                 | Volunteer orgs, etc.                        | 2    |
| `organizations[].position`                              | `"Event Coordinator"`                                                   |                                             | 2    |
| `position_groups[].company.name`                        | `"Voda Cleaning & Restoration"`                                         | Current/past company → `current_company`    | 1    |
| `position_groups[].company.url`                         | `"https://www.linkedin.com/company/..."`                                | Company LinkedIn URL → `current_company_linkedin` | 1    |
| `position_groups[].company.employees`                   | `{"start": 11, "end": 50}`                                              | Headcount range at time of role             | 2    |
| `position_groups[].company.logo`                        | `"https://images.ai-ark.com/...exp:1777679999..."`                      | **Expires — CDN signed URL**                | 3    |
| `position_groups[].date.start`                          | `"2023-01-01"`                                                          | When they started the role → `current_role_start` | 1    |
| `position_groups[].date.end`                            | `null`                                                                  | null = current role; useful for tenure      | 2    |
| `position_groups[].profile_positions[].title`           | `"Chief Executive Officer & Co-Founder"`                                | Role title → `current_title`                | 1    |
| `position_groups[].profile_positions[].employment_type` | `"Full-time"`                                                           |                                             | 2    |
| `position_groups[].profile_positions[].location`        | `"West Salem, Wisconsin, United States"`                                | Role location                               | 2    |
| `position_groups[].profile_positions[].description`     | `null`                                                                  | Role description, often null                | 2    |
| `skills`                                                | `["Marketing", "Direct Sales", "B2B", ...]`                             | Array of skill strings                      | 1    |
| `member_badges.premium`                                 | `false`                                                                 | LinkedIn Premium                            | 1    |
| `member_badges.creator`                                 | `true`                                                                  | LinkedIn Creator mode                       | 1    |
| `member_badges.open_to_work`                            | `false`                                                                 |                                             | 1    |
| `member_badges.hiring`                                  | `false`                                                                 | Currently hiring                            | 1    |
| `department.departments`                                | `["master_operations", "c_suite"]`                                      | AI Ark classification                       | 2    |
| `department.sub_departments`                            | `["founder", "executive", "operations_executive"]`                      |                                             | 2    |
| `department.functions`                                  | `["operations", "entrepreneurship"]`                                    |                                             | 2    |
| `department.seniority`                                  | `"founder"`                                                             | AI Ark seniority label → `seniority`        | 1    |
| `last_updated`                                          | `"2026-02-17"`                                                          | When AI Ark last refreshed                  | 1    |


### Person — Email/Phone (added by export/find-emails)


| Field Path             | Example Value      | Notes                            | Tier |
| ---------------------- | ------------------ | -------------------------------- | ---- |
| `email`                | `"dan@myvoda.com"` | From export or find-emails       | 1    |
| `emailVerified`        | `true`             | BounceBan real-time verification | 1    |
| `phones[].phoneNumber` | `"+17324769273"`   | From people phone command        | 1    |
| `phones[].type`        | `"MOBILE"`         | MOBILE / WORK / OTHER            | 2    |


---

## Company Fields


| Field Path                                 | Example Value                                                           | Notes                                      | Tier |
| ------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------ | ---- |
| `id`                                       | `"5fbd1182-3d7e-3c5d-adbd-8da44e040f00"`                                | AI Ark internal UUID → included in outbound | 1    |
| `summary.name`                             | `"Voda Cleaning & Restoration"`                                         |                                            | 2    |
| `summary.legal_name`                       | `"Jet.com, Inc"`                                                        | Formal legal entity name — rarely populated | 3    |
| `summary.description`                      | `"Voda Cleaning & Restoration is elevating..."`                         | LinkedIn about section                     | 1    |
| `summary.overview`                         | `"Jet operates a smart shopping platform..."`                           | Longer AI summary                          | 1    |
| `summary.seo`                              | `"A new level of franchise opportunity..."`                             | SEO meta description                       | 1    |
| `summary.founded_year`                     | `2009`                                                                  |                                            | 2    |
| `summary.type`                             | `"PRIVATELY_HELD"`                                                      | PUBLIC_COMPANY / PRIVATELY_HELD / etc.     | 2    |
| `summary.industry`                         | `"consumer services"`                                                   | Primary industry                           | 2    |
| `summary.staff.total`                      | `113`                                                                   | Actual headcount (more precise than range) | 1    |
| `summary.staff.range`                      | `{"start": 11, "end": 50}`                                              | LinkedIn-reported range                    | 2    |
| `summary.logo.source`                      | `"https://images.ai-ark.com/...exp:1777679999..."`                      | **Expires — CDN signed URL**               | 3    |
| `link.website`                             | `"http://myvodafranchise.com"`                                          |                                            | 2    |
| `link.domain`                              | `"myvodafranchise.com"`                                                 | Clean domain                               | 1    |
| `link.domain_ltd`                          | `"myvodafranchise.com"`                                                 | Domain without subdomain                   | 2    |
| `link.linkedin`                            | `"https://www.linkedin.com/company/vodacleaningrestoration"`            |                                            | 1    |
| `link.twitter`                             | `"https://x.com/jet"`                                                   | Often null                                 | 3    |
| `link.crunchbase`                          | `"https://www.crunchbase.com/organization/jet"`                         | Often null                                 | 3    |
| `contact.email`                            | `"help@jet.com"`                                                        | Company contact email                      | 1    |
| `contact.phone.raw`                        | `"(855)538-4323"`                                                       |                                            | 2    |
| `contact.phone.sanitized`                  | `"8555384323"`                                                          | Digits only                                | 2    |
| `financial.revenue.annual.start`           | `1000000`                                                               | Revenue range low bound                    | 2    |
| `financial.revenue.annual.end`             | `5000000`                                                               | Revenue range high bound                   | 2    |
| `financial.revenue.annual.amount`          | `"1000000-5000000"`                                                     | Human-readable range → `revenue_range`     | 1    |
| `financial.funding.type`                   | `"VENTURE_ROUND"`                                                       | Last funding type                          | 1    |
| `financial.funding.total_amount`           | `570000000`                                                             | Total raised                               | 1    |
| `financial.funding.last_amount`            | `350000000`                                                             | Last round size                            | 1    |
| `financial.funding.num_investor`           | `22`                                                                    | Investor count                             | 1    |
| `financial.funding.num_funding_rounds`     | `5`                                                                     |                                            | 2    |
| `financial.funding.rounds[].announced_at`  | `"2015-11-24"`                                                          | Per-round date                             | 2    |
| `financial.funding.rounds[].raised_amount` | `350000000`                                                             | Per-round amount                           | 2    |
| `financial.funding.rounds[].type`          | `"VENTURE_ROUND"`                                                       | Per-round type                             | 2    |
| `financial.funding.rounds[].investors`     | `["Google Ventures", "Alibaba Capital Partners"]`                       | Per-round investors → `funding_round_investors` | 1    |
| `location.headquarter.country`             | `"United States"`                                                       |                                            | 2    |
| `location.headquarter.state`               | `"nj - new jersey"`                                                     | Raw, inconsistent formatting               | 2    |
| `location.headquarter.city`                | `"hoboken"`                                                             | Raw, lowercase                             | 2    |
| `location.headquarter.street`              | `"221 river street"`                                                    |                                            | 2    |
| `location.headquarter.postal_code`         | `"07030"`                                                               |                                            | 2    |
| `location.headquarter.raw_address`         | `"nj - new jersey, hoboken, 221 river street"`                          | Full string → `raw_address`                | 1    |
| `location.headquarter.position`            | `{"lng": -73.98556, "lat": 40.748295}`                                  | Lat/lng of HQ                              | 2    |
| `location.locations[]`                     | `[{...}]`                                                               | All office locations (same shape as HQ)    | 2    |
| `technologies[]`                           | `[{"name": "Salesforce", "category": "CRM"}]`                           | Tech stack                                 | 1    |
| `industries[]`                             | `["marketing", "e-commerce", "retail"]`                                 | All industry tags                          | 1    |
| `keywords[]`                               | `["ecommerce", "retail", "technology"]`                                 | Company keywords                           | 1    |
| `hashtags[]`                               | `["franchising", "franchiseopportunities"]`                             | LinkedIn hashtags they use                 | 2    |
| `languages[]`                              | `["english"]`                                                           | Almost always just english                 | 3    |
| `last_updated`                             | `"2026-02-17"`                                                          | When AI Ark last refreshed                 | 1    |


---

*Tier assignments finalized 2026-04-29 — wired into src/io/tier-filter.ts.*
