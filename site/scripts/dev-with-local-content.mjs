import { spawn } from "child_process";
import process from "process";

const CONTENT_DEV_HOST = process.env.CONTENT_DEV_HOST ?? "127.0.0.1";
const CONTENT_DEV_PORT = process.env.CONTENT_DEV_PORT ?? "4310";
const CONTENT_BASE_URL = `http://${CONTENT_DEV_HOST}:${CONTENT_DEV_PORT}/content`;

const children = [];

function run(name, command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  children.push(child);
  child.on("exit", (code, signal) => {
    if (signal || (typeof code === "number" && code !== 0)) {
      shutdown(typeof code === "number" ? code : 1);
    }
  });
  return child;
}

function shutdown(code = 0) {
  while (children.length) {
    const child = children.pop();
    if (child && !child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

async function main() {
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  const exportStep = run("content-export", npmCmd, ["run", "content:export"], {
    env: process.env,
  });

  await new Promise((resolve, reject) => {
    exportStep.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`content:export failed with code ${code}`));
    });
  });

  run("content-server", process.execPath, ["scripts/content-dev-server.mjs"], {
    env: {
      ...process.env,
      CONTENT_DEV_HOST,
      CONTENT_DEV_PORT,
    },
  });

  run("next-dev", npmCmd, ["run", "dev:next"], {
    env: {
      ...process.env,
      CONTENT_BASE_URL,
    },
  });
}

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(0));
});

main().catch((error) => {
  console.error(error);
  shutdown(1);
});
