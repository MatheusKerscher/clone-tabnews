import { spawn } from "child_process";

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: true,
    });

    const signals = ["SIGINT", "SIGTERM", "SIGQUIT", "SIGHUP", "SIGBREAK"];

    const handlers = {};

    signals.forEach((sig) => {
      handlers[sig] = () => {
        console.log(`\n🔴 Signal received (${sig}). Closing...`);
        child.kill(sig);
      };

      process.on(sig, handlers[sig]);
    });

    child.on("close", (code) => {
      signals.forEach((sig) => process.removeListener(sig, handlers[sig]));

      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function main() {
  try {
    await run("npm", ["run", "services:up"]);
    await run("npm", ["run", "services:wait:database"]);
    await run("npm", ["run", "migrations:up"]);
    await run("next", ["dev", "--turbopack"]);
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await run("npm", ["run", "services:stop"]);
  }
}

main();
