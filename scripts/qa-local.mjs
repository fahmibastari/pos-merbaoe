import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:net";

const name = `merbaoe-qa-${randomBytes(4).toString("hex")}`;
const password = randomBytes(24).toString("hex");
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Jalankan melalui npm run qa:local.");

function docker(args, capture = false) {
  const result = spawnSync("docker", args, { env: { ...process.env, POSTGRES_PASSWORD: password }, encoding: "utf8", stdio: capture ? "pipe" : "inherit", timeout: args[0] === "info" ? 10_000 : 180_000 });
  if (result.error || result.status !== 0) throw new Error(capture ? "Docker belum siap. Jalankan Docker Desktop, lalu ulangi npm run qa:local." : `Docker gagal: ${args[0]}`);
  return result.stdout?.trim();
}
function run(args, env) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error(`Pemeriksaan gagal: ${args.join(" ")}`);
}

let created = false;
let embedded;
let dataDir;
try {
  let port;
  if (process.env.QA_POSTGRES_MODULE) {
    const { default: EmbeddedPostgres } = await import(pathToFileURL(resolve(process.env.QA_POSTGRES_MODULE)).href);
    port = await new Promise((resolvePort, reject) => {
      const server = createServer();
      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        server.close(() => resolvePort(address.port));
      });
    });
    dataDir = await mkdtemp(join(tmpdir(), "merbaoe-qa-data-"));
    embedded = new EmbeddedPostgres({ databaseDir: dataDir, user: "postgres", password, port, persistent: true, initdbFlags: ["--locale=C", "--lc-messages=C", "--encoding=UTF8"], postgresFlags: ["-h", "127.0.0.1", "-c", "lc_messages=C"], onLog: () => {}, onError: (error) => console.error(String(error)) });
    console.log("Menyiapkan PostgreSQL QA portable sementara.");
    await embedded.initialise();
    await embedded.start();
    const client = embedded.getPgClient("postgres", "127.0.0.1");
    try {
      await client.connect();
      await client.query('CREATE DATABASE "merbaoe_test"');
    } finally {
      await client.end();
    }
  } else {
    docker(["info"], true);
    console.log(`Menyiapkan PostgreSQL QA sementara: ${name}`);
    docker(["run", "--detach", "--rm", "--name", name, "--label", "merbaoe.qa=temporary", "-p", "127.0.0.1::5432", "-e", "POSTGRES_DB=merbaoe_test", "-e", "POSTGRES_USER=postgres", "-e", "POSTGRES_PASSWORD", "postgres:16-alpine"], true);
    created = true;
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const check = spawnSync("docker", ["exec", name, "pg_isready", "-U", "postgres", "-d", "merbaoe_test"], { stdio: "ignore" });
      if (check.status === 0) { ready = true; break; }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error("PostgreSQL QA belum siap setelah 60 detik.");
    const binding = JSON.parse(docker(["inspect", "--format", '{{json .NetworkSettings.Ports}}', name], true))["5432/tcp"][0];
    port = binding.HostPort;
  }
  const url = `postgresql://postgres:${password}@127.0.0.1:${port}/merbaoe_test`;
  const env = { ...process.env, TEST_DATABASE_URL: url, DATABASE_URL: url, DIRECT_URL: url, JWT_SECRET: randomBytes(32).toString("hex"), PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3100", PORT: "3100" };
  run(["node_modules/prisma/build/index.js", "migrate", "deploy"], env);
  run(["node_modules/prisma/build/index.js", "db", "seed"], env);
  run([npmCli, "run", "qa"], env);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  if (embedded) await embedded.stop();
  if (dataDir && dirname(resolve(dataDir)) === resolve(tmpdir()) && basename(dataDir).startsWith("merbaoe-qa-data-")) {
    await rm(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    console.log("Database QA portable sementara sudah dihapus.");
  }
  if (created) {
    console.log(`Menghapus database QA sementara: ${name}`);
    const result = spawnSync("docker", ["rm", "--force", name], { stdio: "inherit" });
    if (result.status !== 0) process.exitCode = 1;
  }
}
