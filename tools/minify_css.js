// Minifies each canonical style file listed in manifest.json using a real
// CSS parser (the `css` package) rather than text surgery, so calc(),
// quoted strings, and selector combinators (".a .b" vs ".a.b") are handled
// correctly regardless of what future hand-written CSS looks like.
//
// Invoked by tools/build.py; prints {"src/styles/x.css": "<minified>", ...}
// as JSON on stdout, one entry per manifest.styles path.
const fs = require("fs");
const path = require("path");
const css = require("css");

const ROOT = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

const out = {};
for (const entry of manifest.styles) {
  const full = path.join(ROOT, entry.path);
  const text = fs.readFileSync(full, "utf8");
  const ast = css.parse(text, { silent: false });
  if (ast.stylesheet.parsingErrors && ast.stylesheet.parsingErrors.length) {
    process.stderr.write(`CSS parse error in ${entry.path}: ${JSON.stringify(ast.stylesheet.parsingErrors)}\n`);
    process.exit(1);
  }
  out[entry.path] = css.stringify(ast, { compress: true });
}
process.stdout.write(JSON.stringify(out));
