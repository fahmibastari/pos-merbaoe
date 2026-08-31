import { spawnSync } from "node:child_process";

export default function globalTeardown() {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/e2e/fixture-process.ts", "teardown"],
    { stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) {
    throw new Error(`Teardown fixture E2E gagal dengan exit code ${result.status}.`);
  }
}
