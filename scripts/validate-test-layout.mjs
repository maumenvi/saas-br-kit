import { access, readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

const root = process.cwd();
const strictComponents = ["database-prisma", "payment-asaas"];
const errors = [];

async function findFiles(directory, suffix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        return findFiles(entryPath, suffix);
      }
      return entry.isFile() && entry.name.endsWith(suffix) ? [entryPath] : [];
    }),
  );
  return nested.flat();
}

for (const component of strictComponents) {
  const sourceRoot = resolve(root, "src", "adapters", component);
  const testRoot = resolve(root, "tests", "adapters", component);
  const tests = await findFiles(testRoot, ".test.ts");
  const sources = await findFiles(sourceRoot, ".ts");

  for (const testPath of tests) {
    const expectedSource = resolve(
      sourceRoot,
      relative(testRoot, testPath).replace(/\.test\.ts$/, ".ts"),
    );
    await access(expectedSource).catch(() => {
      errors.push(`${relative(root, testPath)} -> ${relative(root, expectedSource)}`);
    });
  }

  if (component === "database-prisma") {
    for (const sourcePath of sources) {
      const expectedTest = resolve(
        testRoot,
        relative(sourceRoot, sourcePath).replace(/\.ts$/, ".test.ts"),
      );
      await access(expectedTest).catch(() => {
        errors.push(`${relative(root, sourcePath)} -> ${relative(root, expectedTest)}`);
      });
    }
  }
}

if (errors.length > 0) {
  throw new Error(`Layout de testes invalido:\n${errors.map((item) => `- ${item}`).join("\n")}`);
}

console.log("Layout dos adapters Prisma e Asaas validado.");
