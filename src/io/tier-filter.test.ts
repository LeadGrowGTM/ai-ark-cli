/**
 * Tests for tier-filter.ts — behavior spec before implementation.
 * Run: bun src/io/tier-filter.test.ts
 */

import { filterByProfile } from "./tier-filter.js";

const samplePerson = {
  profile: {
    first_name: "Dan",
    last_name: "Claps",
    headline: "CEO",
    title: "CEO & Founder",
    summary: "bio here",
    picture: { source: "https://s3.expiring/...?X-Amz-Expires=86400" },
    background: { source: "https://media.licdn.com/bg" },
  },
  link: { linkedin: "https://linkedin.com/in/dan" },
  location: { city: "NY", state: "NY", country: "USA" },
  industry: "Consumer Services",
  position_groups: [
    {
      company: { name: "Voda", url: "https://linkedin.com/company/voda" },
      date: { start: "2023-01-01", end: null },
      profile_positions: [{ title: "CEO & Co-Founder", location: "West Salem, WI" }],
    },
  ],
  skills: ["Sales"],
  member_badges: { premium: false, creator: true, open_to_work: false, hiring: false },
  department: { seniority: "founder", departments: ["c_suite"] },
  email: "dan@voda.com",
  emailVerified: true,
  phones: [{ phoneNumber: "+15551234", type: "MOBILE" }],
  last_updated: "2026-02-17",
};

const sampleCompany = {
  id: "abc-123",
  summary: { description: "desc", overview: "overview", seo: "seo", staff: { total: 113 } },
  link: { domain: "x.com", linkedin: "https://linkedin.com/company/x" },
  contact: { email: "help@x.com" },
  financial: {
    revenue: { annual: { amount: "1M-5M" } },
    funding: {
      type: "SERIES_A",
      total_amount: 10000000,
      last_amount: 5000000,
      num_investor: 5,
      rounds: [{ investors: ["a16z"], announced_at: "2024-01-01" }],
    },
  },
  location: { headquarter: { raw_address: "123 Main St" } },
  technologies: [{ name: "Salesforce", category: "CRM" }],
  industries: ["fintech"],
  keywords: ["payments"],
  last_updated: "2026-02-17",
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string): void {
  if (condition) {
    console.log(`  PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  FAIL: ${msg}`);
    failed++;
  }
}

// Test 1: raw passthrough — reference deep-equal
const raw = filterByProfile(samplePerson, "person", "raw");
assert(JSON.stringify(raw) === JSON.stringify(samplePerson), "raw returns byte-equal input");

// Test 2: outbound returns subset of Tier 1 keys
const ob = filterByProfile(samplePerson, "person", "outbound") as any;
assert("first_name" in ob, "outbound has first_name");
assert("current_company" in ob, "outbound has current_company");

// Test 3: outbound does NOT contain picture or background (S3 URLs)
assert(!("picture" in ob), "outbound strips profile.picture");
assert(!("profile" in ob), "outbound strips nested profile object");

// Test 4: current_company equals position_groups[0].company.name
assert(ob.current_company === "Voda", "current_company mapped correctly");
assert(ob.current_title === "CEO & Co-Founder", "current_title mapped correctly");
assert(ob.current_role_start === "2023-01-01", "current_role_start mapped correctly");

// Test 5: array input maps element-by-element
const arr = filterByProfile([samplePerson, samplePerson], "person", "outbound") as any[];
assert(Array.isArray(arr), "array input returns array");
assert(arr.length === 2, "array length preserved");
assert(arr[0].first_name === "Dan", "array elements filtered");

// Test 6: company revenue_range mapped correctly
const co = filterByProfile(sampleCompany, "company", "outbound") as any;
assert(co.revenue_range === "1M-5M", "company revenue_range mapped");
assert(co.id === "abc-123", "company id preserved");
assert(co.staff_total === 113, "company staff_total mapped");

// Test 7: null-safe — empty object does not throw
let threw = false;
let empty: any;
try {
  empty = filterByProfile({}, "person", "outbound") as any;
} catch {
  threw = true;
}
assert(!threw, "empty object does not throw");
assert(empty.first_name === undefined, "empty object returns undefined for missing fields");

// Bonus: funding_round_investors extracted from rounds
assert(
  Array.isArray(co.funding_round_investors) && co.funding_round_investors[0][0] === "a16z",
  "company funding_round_investors extracted from rounds",
);

// Bonus: phones normalized to phoneNumber only
assert(ob.phones[0].phoneNumber === "+15551234", "phones.phoneNumber preserved");
assert(!("type" in ob.phones[0]), "phones.type stripped in person filter");

// Bonus: seniority extracted from department.seniority
assert(ob.seniority === "founder", "seniority mapped from department.seniority");

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
console.log("ALL TIER FILTER TESTS PASS");
