// Builds the game from game/src/*.ts into:
//   web/pip-farm.html        - the page published as the Claude artifact
//   renderer/index.html      - the desktop app's farm window
// The .ts files are plain scripts that share one scope; tsc type-checks them and joins them in file order.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const template = readFileSync("game/template.html", "utf8");
if (!template.includes("/*@@GAME@@*/")) throw new Error("template is missing the /*@@GAME@@*/ marker");

function build(target) {
  run(`npx tsc -p tsconfig.${target}.json`);
  const js = readFileSync(`out/game.${target}.js`, "utf8");
  // one private scope, like the original single file
  const wrapped = `(()=>{\n"use strict";\n${js}\n})();`;
  return template.replace("/*@@GAME@@*/", () => wrapped);
}

// tests: the web page plus a small hook, wrapped in a document
if (process.argv.includes("--test")) {
  mkdirSync("tests", { recursive: true });
  writeFileSync("tests/t.html", '<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"></head><body>' + build("test") + "</body></html>");
  console.log("built tests/t.html");
  process.exit(0);
}

mkdirSync("web", { recursive: true });
writeFileSync("web/pip-farm.html", build("web"));

// the desktop window needs a full document around the same body
const desk = build("desktop");
const i = desk.indexOf('<div class="app"');
if (i < 0) throw new Error('could not find <div class="app"> in the template');
const head = '<!doctype html>\n<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:dark}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>\n';
mkdirSync("renderer", { recursive: true });
writeFileSync("renderer/index.html", head + desk.slice(0, i) + "</head><body>\n" + desk.slice(i) + "\n</body></html>\n");
console.log("built web/pip-farm.html and renderer/index.html");
