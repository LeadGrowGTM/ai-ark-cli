/**
 * Common shared types used across all AI Ark API endpoints.
 */

// ---------------------------------------------------------------------------
// Error shape
// ---------------------------------------------------------------------------

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  path: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface SortMeta {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: SortMeta;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  last: boolean;
  totalElements: number;
  size: number;
  number: number;
  sort: SortMeta;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * People search response extends paginated response with a trackId
 * used for downstream async operations (email finder, export).
 */
export interface PaginatedPeopleResponse<T> extends PaginatedResponse<T> {
  trackId: string;
}

// ---------------------------------------------------------------------------
// Filter types
//
// The API uses a nested filter structure:
//   { all: { include: string[] }, any: { include: string[] } }
//
// NOT the flat array format { all: string[] } — that causes 400 errors.
// ---------------------------------------------------------------------------

export interface FilterCondition {
  include?: string[];
  exclude?: string[];
}

export interface FilterWithAllAny {
  all?: FilterCondition;
  any?: FilterCondition;
}

// ---------------------------------------------------------------------------
// SearchMatch filter — used by account.name, account.industries,
// account.technologies, account.url, account.keyword, etc.
//
// Company search format:
//   { any: { mode: "SMART", content: ["value"] } }
//
// People contact filter format (fullName, title, skill, etc.):
//   { any: { include: { mode: "SMART", content: ["value"] } } }
// ---------------------------------------------------------------------------

export type SearchMode = "SMART" | "WORD" | "STRICT";

export interface SearchMatchValue {
  mode: SearchMode;
  content: string[];
}

/**
 * Search match filter — used by ALL FilterWithAllAnyPlusSearchMatch fields.
 * Both account-level (name, industries, technologies) and contact-level
 * (fullName, title, skill) use the same structure:
 *   { any: { include: { mode: "SMART", content: ["value"] } } }
 */
export interface SearchMatchCondition {
  include?: SearchMatchValue;
  exclude?: SearchMatchValue;
}

export interface SearchMatchFilter {
  any?: SearchMatchCondition;
  all?: SearchMatchCondition;
}

// Backward compat aliases
export type AccountSearchMatchFilter = SearchMatchFilter;
export type ContactSearchMatchFilter = SearchMatchFilter;
export type ContactSearchMatchCondition = SearchMatchCondition;

/**
 * @deprecated Use AccountSearchMatchFilter or ContactSearchMatchFilter instead.
 * Kept for backward compat during migration.
 */
export interface FilterWithAllAnyPlusSearchMatch extends FilterWithAllAny {
  searchMode?: SearchMode;
}

export interface RangeWithType {
  all?: number[][];
  any?: number[][];
}

export interface DateRange {
  start: string | null;
  end: string | null;
}
