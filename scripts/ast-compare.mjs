// Compare two scripts by syntax tree, ignoring formatting. Usage: node ast-compare.mjs a.js b.js
import * as acorn from "acorn";
import { readFileSync } from "node:fs";
const norm = (src) => JSON.stringify(acorn.parse(src, { ecmaVersion: "latest" }), (k, v) =>
  ["start", "end", "loc", "range", "raw"].includes(k) ? undefined : v);
const [a, b] = process.argv.slice(2).map(f => norm(readFileSync(f, "utf8")));
if (a === b) { console.log("IDENTICAL syntax trees"); process.exit(0); }
let i = 0; while (a[i] === b[i]) i++;
console.log("DIFFER at", i); console.log("A:", a.slice(i - 200, i + 200)); console.log("B:", b.slice(i - 200, i + 200)); process.exit(1);
