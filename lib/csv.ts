/**
 * Rows of text as a CSV file.
 *
 * Small on purpose, and its own module because the escaping is the whole thing:
 * a client called "Weinstein, D." or a note with a line break in it turns an
 * unescaped export into a file that opens with the columns shifted, and nobody
 * notices until a number has been read out of the wrong one.
 *
 * RFC 4180: quote any field containing a comma, a quote or a newline, and double
 * the quotes inside it.
 */

const NEEDS_QUOTES = /[",\r\n]/;

function field(value: string): string {
  if (!NEEDS_QUOTES.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * `\r\n` between rows, and a trailing one.
 *
 * CRLF because that is what the spec says and what Excel on Windows expects;
 * everything that reads CSV at all reads it, and the one that does not is a
 * bug worth having rather than a file that opens as a single line.
 */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(field).join(",")).join("\r\n") + "\r\n";
}

/**
 * A filename a person can find again in their downloads folder.
 *
 * Dates in it, because the second export is the one that gets confused with the
 * first, and "resumen.csv (2)" says nothing about which month it holds.
 */
export function csvFilename(parts: (string | number)[]): string {
  const stem = parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${stem || "export"}.csv`;
}
