import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ---------------------------------------------------------------------------
// Spawn the Python FastAPI backend as a child process so that:
//  - Port 8080 opens immediately (Express doesn't wait for Python)
//  - Python is a managed child — it dies when Node exits (no orphans)
//  - If Python crashes it is restarted automatically
// ---------------------------------------------------------------------------
const PYTHON_PORT = 5000;

function spawnPython() {
  // Resolve project root (two levels up from dist/index.mjs at runtime)
  const projectRoot = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
    "..",
    "..",
  );
  const apiDir = path.join(projectRoot, "artifacts", "predictor-api");

  logger.info({ apiDir }, "[python] Starting Python API");

  // Use the venv interpreter so the prod container's broken sitecustomize
  // is bypassed entirely — venv Python has its own clean sys.path.
  const venvPython = path.join(apiDir, ".venv", "bin", "python3");
  const pythonBin = existsSync(venvPython) ? venvPython : "python3";
  logger.info({ pythonBin }, "[python] Using interpreter");

  const py = spawn(
    pythonBin,
    ["-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", String(PYTHON_PORT)],
    {
      cwd: apiDir,
      stdio: "inherit",
      env: { ...process.env },
    },
  );

  py.on("error", (err) => {
    logger.error({ err }, "[python] Failed to start Python process");
  });

  py.on("exit", (code, signal) => {
    if (signal === "SIGTERM" || signal === "SIGINT") {
      // Clean shutdown — don't restart
      return;
    }
    logger.warn({ code, signal }, "[python] Python process exited — restarting in 3 s");
    setTimeout(spawnPython, 3000);
  });

  // Forward termination signals to Python so it shuts down cleanly
  const stop = (sig: NodeJS.Signals) => {
    if (!py.killed) py.kill(sig);
  };
  process.once("SIGTERM", () => stop("SIGTERM"));
  process.once("SIGINT", () => stop("SIGINT"));

  return py;
}

// Start Python immediately; Express starts below without waiting.
spawnPython();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
