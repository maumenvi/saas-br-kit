import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const testRoot = path.resolve("tests");
const packageTest = path.join(testRoot, "core", "index.test.ts");

function listTests(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listTests(entryPath);
      }
      const isTest = entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.mjs");
      return entry.isFile() && isTest && entryPath !== packageTest ? [entryPath] : [];
    })
    .sort();
}

const result = spawnSync(process.execPath, ["--test", ...listTests(testRoot)], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
