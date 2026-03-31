/**
 * Barrel export for all AI Ark API types.
 * Import from here: `import type { Person, CompanySearchRequest } from "./types/api.js"`
 */

export type * from "./common.js";
export type * from "./responses.js";
export type * from "./requests.js";

export type ApiEndpoint =
  | "/companies"
  | "/people"
  | "/people/reverse-lookup"
  | "/people/mobile-phone-finder"
  | "/people/analysis"
  | "/people/export"
  | "/people/email-finder"
  | "/payments/credits";
