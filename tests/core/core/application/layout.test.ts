import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const applicationRoot = path.resolve("src/core/application");
const aggregateModules = ["actor", "customer", "organization", "plan", "subscription"];
const declarationPattern =
  /^(?:export\s+)?(?:abstract\s+)?(?:class|interface|type|enum)\s+[A-Za-z_$][\w$]*/gm;

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? listTypeScriptFiles(entryPath)
        : entry.isFile() && entry.name.endsWith(".ts")
          ? [entryPath]
          : [];
    }),
  );

  return nestedFiles.flat().sort();
}

test("application aggregate modules use directories instead of root implementation files", async () => {
  for (const moduleName of aggregateModules) {
    const moduleDirectory = path.join(applicationRoot, moduleName);
    const moduleStat = await stat(moduleDirectory);

    assert.equal(moduleStat.isDirectory(), true, `${moduleName} must be an application directory`);
    await assert.rejects(
      stat(path.join(applicationRoot, `${moduleName}.ts`)),
      `${moduleName}.ts must not replace the application directory`,
    );
  }
});

test("application implementation files declare at most one class or type", async () => {
  const violations: string[] = [];

  for (const filePath of await listTypeScriptFiles(applicationRoot)) {
    const source = await readFile(filePath, "utf8");
    const declarations = source.match(declarationPattern) ?? [];

    if (declarations.length > 1) {
      violations.push(`${path.relative(applicationRoot, filePath)}: ${declarations.join(", ")}`);
    }
  }

  assert.deepEqual(violations, []);
});
