import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  commandExists,
  getScriptWorkingDirectory,
  isInterpreterAvailable,
  pickInterpreter,
} from "../src/features/runner";
import {
  findShellCheck,
  resolveShellCheckPath,
  resetShellCheckPathCache,
} from "../src/features/shellcheck";

test("pickInterpreter honors configured shell override", () => {
  assert.deepEqual(
    pickInterpreter("/vault/script.sh", "sh", "#!/bin/bash", "/custom/bash"),
    ["/custom/bash", "/vault/script.sh"],
  );
});

test("pickInterpreter supports env shebangs", () => {
  assert.deepEqual(
    pickInterpreter("/vault/script.sh", "sh", "#!/usr/bin/env bash", ""),
    ["bash", "/vault/script.sh"],
  );
});

test("pickInterpreter supports env -S shebangs with flags", () => {
  assert.deepEqual(
    pickInterpreter("/vault/script.sh", "sh", "#!/usr/bin/env -S bash -euo pipefail", ""),
    ["bash", "-euo", "pipefail", "/vault/script.sh"],
  );
});

test("pickInterpreter preserves direct shebang flags", () => {
  assert.deepEqual(
    pickInterpreter("/vault/script.sh", "sh", "#!/bin/bash -eu", ""),
    ["/bin/bash", "-eu", "/vault/script.sh"],
  );
});

test("getScriptWorkingDirectory handles posix paths", () => {
  assert.equal(getScriptWorkingDirectory("/vault/scripts/test.sh"), "/vault/scripts");
});

test("getScriptWorkingDirectory handles windows paths", () => {
  assert.equal(
    getScriptWorkingDirectory("C:\\vault\\scripts\\test.ps1"),
    "C:\\vault\\scripts",
  );
});

test("commandExists recognizes absolute executables", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "scriptvault-test-"));
  const filePath = path.join(tempDir, process.platform === "win32" ? "runner.cmd" : "runner");
  fs.writeFileSync(filePath, process.platform === "win32" ? "@echo off\r\n" : "#!/bin/sh\n");
  if (process.platform !== "win32") {
    fs.chmodSync(filePath, 0o755);
  }

  assert.equal(commandExists(filePath), true);
  assert.equal(isInterpreterAvailable([filePath, "script.sh"]), true);
});

test("commandExists rejects missing commands", () => {
  assert.equal(commandExists(path.join(os.tmpdir(), "definitely-missing-scriptvault-bin")), false);
  assert.equal(isInterpreterAvailable(["definitely-missing-scriptvault-bin"]), false);
});

test("resolveShellCheckPath returns null when PATH fallback is unavailable", () => {
  const originalPath = process.env.PATH;
  process.env.PATH = "";

  try {
    assert.equal(resolveShellCheckPath(["shellcheck"]), null);
  } finally {
    process.env.PATH = originalPath;
  }
});

test("findShellCheck caches misses", () => {
  const originalPath = process.env.PATH;
  process.env.PATH = "";
  resetShellCheckPathCache();

  try {
    assert.equal(findShellCheck("/definitely/custom/shellcheck"), "/definitely/custom/shellcheck");
    resetShellCheckPathCache();
    assert.equal(findShellCheck(), findShellCheck());
  } finally {
    process.env.PATH = originalPath;
    resetShellCheckPathCache();
  }
});
