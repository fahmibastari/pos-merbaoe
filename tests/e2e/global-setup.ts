import { spawnSync } from "node:child_process";
import type { FullConfig } from "@playwright/test";

export default function globalSetup(config: FullConfig) {
  const baseURL = String(config.projects[0].use.baseURL);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/e2e/fixture-process.ts", "setup", baseURL],
    { stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) {
    throw new Error(`Setup fixture E2E gagal dengan exit code ${result.status}.`);
  }
}
