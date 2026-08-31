import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "all";
if (!new Set(["unit", "integration", "all"]).has(mode)) {
  console.error("Mode test harus unit, integration, atau all.");
  process.exit(2);
}

function collectTests(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectTests(path);
    return entry.isFile() && entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

const files = collectTests("src").filter((path) => {
  const integration = path.endsWith(".integration.test.ts");
  return mode === "all" || (mode === "integration" ? integration : !integration);
});

const result = spawnSync(
  process.execPath,
  ["--import", "tsx", "--test", "--test-concurrency=1", ...files],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_DB_TESTS: mode === "unit" ? "0" : "1",
    },
  },
);

process.exit(result.status ?? 1);
