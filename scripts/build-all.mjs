import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const npmExecPath = process.env.npm_execpath;
const nodeExecPath = process.execPath;

const run = (cmdArgs) => {
  const result = npmExecPath
    ? spawnSync(nodeExecPath, [npmExecPath, ...cmdArgs], { stdio: "inherit" })
    : spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", cmdArgs, {
        stdio: "inherit",
        shell: false,
      });

  if (result.error) {
    console.error("[build:all] Failed to run command:", result.error);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(["run", "build", "--", ...args]);
run(["run", "build:min", "--", ...args]);
