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
// ---------------------------------------------------------------------------

export interface FilterWithAllAny {
  all?: string[];
  any?: string[];
}

export interface FilterWithAllAnyPlusSearchMatch extends FilterWithAllAny {
  searchMode?: "SMART" | "WORD" | "STRICT";
}

export interface RangeWithType {
  all?: number[][];
  any?: number[][];
}

export interface DateRange {
  start: string | null;
  end: string | null;
}
