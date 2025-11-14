// src/utils/csvParser.js
// Robust CSV parser that handles quoted fields and commas inside quotes.
// Returns array of objects keyed by header row.
export function parseCSV(csvText) {
  if (!csvText) return [];

  const text = csvText.replace(/\r/g, "");
  const lines = text.split("\n").filter(Boolean);
  if (!lines.length) return [];

  // parse headers
  const rawHeaders = lines.shift();
  const headers = splitCSVRow(rawHeaders).map(h => h.trim());

  const rows = lines.map(line => {
    const cols = splitCSVRow(line);
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = cols[i] !== undefined ? cols[i].trim() : "";
    }
    return obj;
  });

  return rows;
}

function splitCSVRow(row) {
  const out = [];
  let cur = "";
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      // if double quote and next char also quote, it's an escaped quote
      if (insideQuotes && row[i + 1] === '"') {
        cur += '"';
        i++; // skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (ch === "," && !insideQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
