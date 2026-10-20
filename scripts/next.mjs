import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

process.env.NEXT_SWC_PATH ??= path.join(projectRoot, "work", "next-swc");

const result = spawnSync(process.execPath, [nextCli, ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
