import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";

function splitStatements(source) {
  const statements = [];
  let current = "";
  let dollarTag = null;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      current += char;
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !dollarTag && char === "-" && next === "-") {
      inLineComment = true;
      current += `${char}${next}`;
      index += 1;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (dollarTag && source.startsWith(dollarTag, index)) {
        current += dollarTag;
        index += dollarTag.length - 1;
        dollarTag = null;
        continue;
      }
      if (!dollarTag && char === "$") {
        const match = source.slice(index).match(/^\$[A-Za-z0-9_]*\$/);
        if (match) {
          dollarTag = match[0];
          current += dollarTag;
          index += dollarTag.length - 1;
          continue;
        }
      }
    }

    if (!dollarTag && !inDoubleQuote && char === "'" && source[index - 1] !== "\\") inSingleQuote = !inSingleQuote;
    if (!dollarTag && !inSingleQuote && char === '"') inDoubleQuote = !inDoubleQuote;

    if (char === ";" && !dollarTag && !inSingleQuote && !inDoubleQuote) {
      if (current.trim()) statements.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) statements.push(current.trim());
  return statements;
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to apply the schema.");

const sql = neon(process.env.DATABASE_URL);
const input = process.argv[2]
  ? new URL(`../../${process.argv[2]}`, import.meta.url)
  : new URL("../../db/schema.sql", import.meta.url);
const schema = await readFile(input, "utf8");
const statements = splitStatements(schema);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} schema statements successfully.`);
