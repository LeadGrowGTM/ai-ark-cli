# AI Ark URL Parameters — Official Reference

Authoritative mapping from CLI flags → platform URL query params. Used during the **Link Presentation** phase to construct and explain review URLs to users.

Source: AI Ark official `search-filters-url-parameters` doc (2026-04).

## Base URLs

| Surface    | URL                                        |
| ---------- | ------------------------------------------ |
| Companies  | `https://app.ai-ark.com/search/company?`   |
| People     | `https://app.ai-ark.com/search/people?`    |

## Separator Grammar

| Symbol | Purpose                           | URL-encoded |
| ------ | --------------------------------- | ----------- |
| `^`    | Multiple values in one filter (OR)| `%5E`       |
| `>`    | Min/max in range filters          | `%3E`       |
| `::`   | Hierarchy within a single entry   | `%3A%3A`    |
| `&`    | Between different filters         | —           |

## Filter Logic

- **Include** = show results matching ANY value (OR)
- **Exclude** = hide results matching ANY value (OR)
- **Include (AND)** = results must match ALL values

---

## People Surface Parameters

### Job Role — Current

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `current_job_include_job_title` | `--title` | `^`-joined |
| `current_job_exclude_job_title` | `--exclude-title` | `^`-joined |
| `current_job_all_of_job_title` | — | `^`-joined (AND) |
| `current_job_role_seniority` | `--seniority` | `^`-joined |
| `current_job_role_department` | `--department` | `Dept::SubFunction` `^`-joined |
| `current_job_experience_current_job` | `--job-duration-min/max` | `{Y}:{M}>{Y}:{M}` |
| `current_job_experience_current_company` | — | set via UI |
| `current_job_experience_time` | — | set via UI |
| `latest_active_job_title_only` | — | `true`/`false` |

### Job Role — Previous

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `prev_job_include_job_title` | `--previous-title` | `^`-joined |
| `prev_job_exclude_job_title` | — | `^`-joined |
| `prev_job_all_of_job_title` | — | `^`-joined (AND) |

### People Keywords & Skills

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `people_include_keywords` | `--keyword` (people context) | `^`-joined |
| `people_exclude_keywords` | — | `^`-joined |
| `people_all_of_keywords` | — | `^`-joined (AND) |
| `include_skills` | `--skills` | `^`-joined |
| `exclude_skills` | — | `^`-joined |
| `all_of_skills` | — | `^`-joined (AND) |

### People Info & Search

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `fullName` | `--name` | single text |
| `include_linkedin_url_for_contact` | `--linkedin` | URL text |
| `include_person_id` | — | `Name::ID::Title` `^`-joined |
| `exclude_person_id` | — | `Name::ID::Title` `^`-joined |

### People Location

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `contact_include_location_region` | `--location` | `Continent::Country` `^`-joined |
| `contact_exclude_location_region` | `--exclude-location` | same |
| `contact_include_location_cities` | — | `City Country` `^`-joined |
| `contact_exclude_location_cities` | — | same |

### Profile Badges

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `profile_badge_contacts_include` | `--badge` | `^`-joined enum |
| `profile_badge_contacts_exclude` | `--exclude-badge` | `^`-joined enum |
| `profile_badge_contacts_all_of` | — | `^`-joined (AND) |

### People Languages

| URL Param | Format |
| --------- | ------ |
| `include_languages_for_contact` | `^`-joined |
| `exclude_languages_for_contact` | `^`-joined |
| `all_of_languages_for_contact` | `^`-joined (AND) |
| `number_of_languages_for_contact` | `min>max` |

### People Education

| URL Param | Format |
| --------- | ------ |
| `include_education_school` | `SchoolName::SchoolID::Domain` `^`-joined |
| `include_education_degree` | `^`-joined |
| `include_education_major` | `^`-joined |
| `education_year` | `min>max` |

### Certifications

| URL Param | Format |
| --------- | ------ |
| `include_certification` | `^`-joined |
| `exclude_certification` | `^`-joined |
| `all_of_certification` | `^`-joined (AND) |

### Current & Past Company

| URL Param | Format |
| --------- | ------ |
| `include_current_company` | `CompanyName::CompanyID` `^`-joined |
| `exclude_current_company` | same |
| `include_previous_company` | same |
| `exclude_previous_company` | same |
| `latest_active_company_only` | `true`/`false` |

---

## Company-Scoped Parameters (Both Surfaces)

### Company Info

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `include_company_name` | `--company` / `--name` | text |
| `include_company_domain` | — | text |
| `include_linkedin_url_for_account` | — | URL text |

### Industry

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `include_industry` | `--industry` | `^`-joined |
| `exclude_industry` | `--exclude-industry` | `^`-joined |

### Technologies

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `include_technologies` | `--technology` | `^`-joined |
| `exclude_technologies` | — | `^`-joined |
| `all_of_technologies` | — | `^`-joined (AND) |

### Employee Size

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `employee_size` | — | predefined ranges `^`-joined (e.g. `51-200^201-500`) |
| `employee_size_custom` | `--employees` | `min>max` |

### Company HQ Location

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `company_hq_include_location_region` | `--location` (company surface) | `Continent::Country` `^`-joined |
| `company_hq_exclude_location_region` | `--exclude-location` (company surface) | same |
| `company_hq_include_location_cities` | — | `City Country` `^`-joined |
| `company_hq_exclude_location_cities` | — | same |

### Company Keywords

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `companies_include_keywords` | `--keyword` (company surface) | `^`-joined |
| `companies_exclude_keywords` | — | `^`-joined |
| `companies_all_of_keywords` | — | `^`-joined (AND) |

### Funding

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `funding_type` | `--funding-type` | `^`-joined (e.g. `series_a^series_b^seed`) |
| `all_funded_total_funding_amount` | — | `min>max` |
| `all_funded_latest_funding_amount` | — | `min>max` |
| `all_funded_last_raised_at` | — | date range |

### Revenue

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `revenue` | `--revenue` | range bucket labels `^`-joined (e.g. `$1M - $10M^$10M - $50M`) |

### Founded Year

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `year_founded` | `--founded` | `min>max` (e.g. `2015>2024`) |

### Products & Services

| URL Param | CLI Flag | Format |
| --------- | -------- | ------ |
| `include_products_and_services` | `--products` | `^`-joined |
| `exclude_products_and_services` | — | `^`-joined |
| `all_of_products_and_services` | — | `^`-joined (AND) |

### Company Type

| URL Param | Format |
| --------- | ------ |
| `company_type_include_any` | `PRIVATE^PUBLIC^STARTUP` etc |
| `company_type_exclude` | same |

### NAICS Codes

| URL Param | Format |
| --------- | ------ |
| `naics_include_any` | `^`-joined codes |
| `naics_exclude_any` | same |
| `naics_include_and` | `^`-joined (AND) |

### Company Social Media

| URL Param | Format |
| --------- | ------ |
| `social_media_company_include_social_media` | `LINKEDIN^TWITTER^FACEBOOK` etc |
| `social_media_company_exclude_social_media` | same |

### Headcount Growth

| URL Param | Format |
| --------- | ------ |
| `headcount_growth_department` | text or `all` |
| `headcount_growth_number` | `min>max` (percentage) |

### Employee by Department

| URL Param | Format |
| --------- | ------ |
| `employee_by_department_department` | text |
| `employee_by_department_number` | `min>max` |

### Operation Languages

| URL Param | Format |
| --------- | ------ |
| `include_languages_for_account` | `^`-joined |
| `exclude_languages_for_account` | `^`-joined |
| `number_of_languages_for_account` | `min>max` |

### Locations Worldwide

| URL Param | Format |
| --------- | ------ |
| `number_of_retail_locations` | `min>max` |

---

## List / Label / Export Filters

These use the format `Name::ID` joined by `^`. IDs are server-side — cannot construct manually.

| Scope | Include | Exclude | All-of |
| ----- | ------- | ------- | ------ |
| Company lists | `companies_include_list` | `companies_exclude_list` | `companies_all_of_list` |
| People lists | `people_include_list` | `people_exclude_list` | `people_all_of_list` |
| Company labels | `labels_account_include` | `labels_account_exclude` | `companies_all_of_labels` |
| People labels | `labels_contact_include` | `labels_contact_exclude` | `contacts_all_of_labels` |
| Company exports | `companies_exports_request_include` | `companies_exports_request_exclude` | `companies_exports_request_all_of` |
| People exports | `people_exports_request_include` | `people_exports_request_exclude` | `people_exports_request_all_of` |

---

## Bulk Filters (Server-Side Only)

These store a server-side list reference, NOT the actual values. Generated by the app UI.

| URL Param | Format |
| --------- | ------ |
| `bulk_include_company_domain` | `<search-list-id>::<count>::company domains` |
| `bulk_exclude_company_domain` | same |
| `bulk_include_company_social` | `<search-list-id>::<count>::company linkedin urls` |
| `bulk_include_company_name` | `<search-list-id>::<count>::company names` |
| `bulk_include_person_linkedin_url` | `<search-list-id>::<count>::person linkedin urls` |

**Cannot construct manually.** The CLI writes domains to `ai-ark-domains-paste.md` for manual paste instead.

---

## Combined URL Examples

**Company search** — Tech/Finance, 51-500 employees, Germany/France, SaaS keywords, founded 2015-2024:
```
https://app.ai-ark.com/search/company?include_industry=Technology^Financial%20Services&employee_size=51-200^201-500&company_hq_include_location_region=Europe::Germany^Europe::France&companies_include_keywords=SaaS^Cloud&year_founded=2015>2024
```

**People search** — CTOs/VPs using React+AWS, Berlin/Munich, English+German speakers:
```
https://app.ai-ark.com/search/people?current_job_include_job_title=CTO^VP%20Engineering^VP%20Technology&include_technologies=React^AWS&contact_include_location_cities=Berlin%20Germany^Munich%20Germany&include_languages_for_contact=English^German
```
