/**
 * Barrel export for I/O utilities.
 */

export { formatOutput } from "./format.js";
export type { OutputFormat } from "./format.js";
export { readCsvFile, readStdin } from "./input.js";
export type { InputRecord } from "./input.js";
export { pushToClay } from "./clay.js";
