import fs from "fs";
import path from "path";

const root = process.cwd();

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

const failures = [];
const warnings = [];

const requiredFiles = ["README.md", "LICENSE", "manifest.json", "versions.json"];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    fail(`Missing required root file: ${file}`);
  }
}

const manifest = readJson("manifest.json");
const versions = readJson("versions.json");
const pkg = readJson("package.json");

if (/\bobsidian\b/i.test(manifest.description)) {
  fail("manifest.description must not include the word 'Obsidian'.");
}

if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
  fail(`manifest.version is not strict semver: ${manifest.version}`);
}

if (pkg.version !== manifest.version) {
  fail(`package.json version (${pkg.version}) must match manifest version (${manifest.version}).`);
}

if (versions[manifest.version] !== manifest.minAppVersion) {
  fail(
    `versions.json must contain "${manifest.version}": "${manifest.minAppVersion}".`,
  );
}

if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(manifest.authorUrl ?? "")) {
  fail("manifest.authorUrl should point to an author profile/site, not a repository.");
}

if (!manifest.isDesktopOnly) {
  warn("Plugin is not marked desktop-only. Recheck any desktop APIs before release.");
}

const sourceFiles = fs.readdirSync(path.join(root, "src"), { recursive: true })
  .filter((entry) => typeof entry === "string" && entry.endsWith(".ts"))
  .map((entry) => path.join(root, "src", entry));

for (const file of sourceFiles) {
  const source = fs.readFileSync(file, "utf8");
  const idMatches = source.matchAll(/\bid:\s*"([^"]+)"/g);
  for (const match of idMatches) {
    const commandId = match[1];
    if (commandId.includes(manifest.id)) {
      fail(`Command id "${commandId}" in ${path.relative(root, file)} includes the plugin id.`);
    }
  }
}

if (!fs.existsSync(path.join(root, "main.js"))) {
  warn("main.js is missing locally. Run `npm run build` before publishing a release.");
}

if (!fs.existsSync(path.join(root, "styles.css"))) {
  warn("styles.css is missing locally. If the plugin has styles, release assets will be incomplete.");
}

console.log("Release validation");
for (const message of warnings) {
  console.log(`WARN: ${message}`);
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`FAIL: ${message}`);
  }
  process.exit(1);
}

console.log("OK: core marketplace checks passed.");
if (warnings.length > 0) {
  console.log("Review warnings above before release.");
}
