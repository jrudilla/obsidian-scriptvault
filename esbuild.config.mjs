import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const prod = process.argv[2] === "production";

// @codemirror/state and @codemirror/view MUST be external — they are
// singletons shared with Obsidian. Bundling them twice causes Facet ID
// conflicts and crashes. Everything else we bundle ourselves so we
// control exact versions and avoid "classHighlighter not exported" issues.
const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/state",
    "@codemirror/view",
    ...builtins,
  ],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: prod,
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
