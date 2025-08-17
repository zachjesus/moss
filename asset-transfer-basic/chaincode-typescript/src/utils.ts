/* SPDX-License-Identifier: Apache-2.0 */
/**
 * Minimal single-file helpers: identifier parsing/formatting, metadata dispatch,
 * ISO 8601 date validation and small accessors for Asset usage.
 */

/* Identifier config  */
export const IDENTIFIER_TYPES = [
  "ISBN",
  "OCLC",
  "LCCN",
  "OLID",
  "DOI",
] as const;
export type IdentifierType = (typeof IDENTIFIER_TYPES)[number];

export const IdentifierPrefix = "_";

export interface ParsedIdentifier {
  type: IdentifierType;
  value: string;
}

export function isIdentifierType(x: string): x is IdentifierType {
  return (IDENTIFIER_TYPES as readonly string[]).includes(x);
}

/** List of accepted file extensions (lowercase, without dot) */
export const ACCEPTED_FILE_EXTENSIONS = [
  "pdf",
  "epub",
  "txt",
  "json",
  "jpg",
  "jpeg",
  "png",
] as const;
export type AcceptedFileExtension = (typeof ACCEPTED_FILE_EXTENSIONS)[number];

/**
 * Other Defaults
 */

export const DEFAULT_OWNER = "Zachary Rosario";

export const ACCEPTED_STATUSES = ["open", "loaned", "locked"] as const;
export type AssetStatus = (typeof ACCEPTED_STATUSES)[number];

export function getAcceptedStatuses(): string[] {
  return Array.from(ACCEPTED_STATUSES);
}

export function isAcceptedStatus(s: string): s is AssetStatus {
  return (ACCEPTED_STATUSES as readonly string[]).includes(s);
}

/**
 * Parse identifier string from "TYPE_value" -> { type, value }.
 * Throws Error on invalid format or unsupported type.
 */
export function parseIdentifier(identifier: string): ParsedIdentifier {
  if (typeof identifier !== "string" || identifier.trim() === "") {
    throw new Error("identifier must be a non-empty string");
  }

  const trimmed = identifier.trim();
  const pattern = new RegExp(
    `^(${Array.from(IDENTIFIER_TYPES).join("|")})${IdentifierPrefix}(.+)$`,
  );
  const m = trimmed.match(pattern);
  if (!m) {
    throw new Error(`Invalid or unsupported identifier: ${identifier}`);
  }

  const [, typeRaw, valueRaw] = m;
  if (!isIdentifierType(typeRaw)) {
    throw new Error(`Unsupported identifier type: ${typeRaw}`);
  }

  const value = valueRaw.trim();
  if (value === "") {
    throw new Error(`Identifier value is empty for: ${identifier}`);
  }

  return { type: typeRaw, value };
}

/** Convert ParsedIdentifier object back to regular string */
export function parsedIdToString(p: ParsedIdentifier): string {
  return `${p.type}${IdentifierPrefix}${p.value}`;
}

/* ----- Metadata handlers ----- */
export const metadataHandlers: Record<
  IdentifierType,
  (value: string) => string
> = {
  DOI: (value) => `https://api.crossref.org/works/${encodeURIComponent(value)}`,
  ISBN: (value) =>
    `https://openlibrary.org/api/books?bibkeys=ISBN:${value}&format=json`,
  OCLC: (value) =>
    `https://openlibrary.org/api/books?bibkeys=OCLC:${value}&format=json`,
  LCCN: (value) =>
    `https://openlibrary.org/api/books?bibkeys=LCCN:${value}&format=json`,
  OLID: (value) =>
    `https://openlibrary.org/api/books?bibkeys=OLID:${value}&format=json`,
};

/**
 * Accept either a identifier string or ParsedIdentifier and return metadata URL/string.
 * Throws Error on invalid identifier or missing handler.
 */
export function metadataHandler(input: string | ParsedIdentifier): string {
  const parsed = typeof input === "string" ? parseIdentifier(input) : input;
  const handler = metadataHandlers[parsed.type];
  return handler(parsed.value);
}

/*
 * Identifier accessors.
 */
export function getIdentifierType(identifier: string): IdentifierType | null {
  try {
    return parseIdentifier(identifier).type;
  } catch {
    return null;
  }
}
export function getIdentifierValue(identifier: string): string | null {
  try {
    return parseIdentifier(identifier).value;
  } catch {
    return null;
  }
}

/**
 * Examples accepted:
 *  - 2023-01-02
 *  - 2023-01-02T15:04:05Z
 *  - 2023-01-02T15:04:05.123+01:00
 */
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

export function validateISO(value: string): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (s === "") return false;
  if (!ISO_8601_REGEX.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

/**
 * Check if a file name or MIME type has an accepted file extension.
 * Accepts both file names (with extensions) and MIME types.
 * Returns true if the extension is one of ACCEPTED_FILE_EXTENSIONS.
 */
export function isAcceptedFileExtension(fileNameOrMime: string): boolean {
  if (typeof fileNameOrMime !== "string" || fileNameOrMime.trim() === "")
    return false;
  const s = fileNameOrMime.trim().toLowerCase();

  if (s.includes("/")) {
    const subtypeRaw = s.split("/").pop() || "";
    const subtype = subtypeRaw.split(";")[0].split("+")[0];
    if (ACCEPTED_FILE_EXTENSIONS.includes(subtype as AcceptedFileExtension))
      return true;
  }

  const extMatch = s.match(/\.([a-z0-9]+)(?:$|\?)/);
  if (!extMatch) return false;
  return ACCEPTED_FILE_EXTENSIONS.includes(
    extMatch[1] as AcceptedFileExtension,
  );
}
