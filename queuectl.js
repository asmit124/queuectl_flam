// queuectl.js - PowerShell-compatible CLI job queue system
const fs = require("fs");
const path = require("path");
const storage = require("./lib/storage");

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || ["help", "-h", "--help"].includes(argv[0])) {
    return showHelp();
  }

  const cmd = argv[0];

  try {
    // ---------------- ENQUEUE (inline JSON) ----------------
    if (cmd === "enqueue") {
      const payload = argv.slice(1).join(" ").trim();
      if (!payload) {
        console.error('Usage: node queuectl.js enqueue "{\"id\":\"job1\",\"command\":\"echo hi\"}"');
        process.exit(1);
      }

      const jobObj = JSON.parse(payload);
      if (!jobObj.id || !jobObj.command) {
        console.error("Job must contain 'id' and 'command'");
        process.exit(1);
      }

      const job = await storage.createJob(jobObj);
      console.log(" Enqueued:", job.id);
      process.exit(0);
    }

    // ---------------- ENQUEUE-FILE ----------------
    if (cmd === "enqueue-file") {
      const file = argv[1];
      if (!file) {
        console.error("Usage: node queuectl.js enqueue-file <path-to-json>");
        process.exit(1);
      }

      const filePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        console.error(" File not found:", filePath);
        process.exit(1);
      }

      const jsonData = fs.readFileSync(filePath, "utf8").trim();
      const jobObj = JSON.parse(jsonData);
      if (!jobObj.id || !jobObj.command) {
        console.error("Job must contain 'id' and 'command'");
        process.exit(1);
      }

      const job = await storage.createJob(jobObj);
      console.log(" Enqueued from file:", job.id);
      process.exit(0);
    }

    // ---------------- LIST JOBS ----------------
    if (cmd === "list") {
      const stateIndex = argv.indexOf("--state");
      const state = stateIndex >= 0 ? argv[stateIndex + 1] : null;
      if (!state) {
        console.error("Usage: node queuectl.js list --state <pending|processing|completed|failed|dead>");
        process.exit(1);
      }
      const jobs = await storage.listJobsByState(state);
      console.log(JSON.stringify(jobs, null, 2));
      process.exit(0);
    }

    // ---------------- STATUS ----------------
    if (cmd === "status") {
      const jobs = await storage.listAll();
      const counts = jobs.reduce((a, j) => {
        a[j.state] = (a[j.state] || 0) + 1;
        return a;
      }, {});
      console.log(" Job Summary:", counts);
      process.exit(0);
    }

    // ---------------- DLQ LIST ----------------
    if (cmd === "dlq" && argv[1] === "list") {
      const jobs = await storage.listJobsByState("dead");
      console.log(JSON.stringify(jobs, null, 2));
      process.exit(0);
    }

    // ---------------- DLQ RETRY ----------------
    if (cmd === "dlq" && argv[1] === "retry") {
      const jobId = argv[2];
      if (!jobId) {
        console.error("Usage: node queuectl.js dlq retry <jobId>");
        process.exit(1);
      }

      const job = await storage.updateJob(jobId, {
        state: "pending",
        attempts: 0,
      });
      if (job) {
        console.log(` Retrying dead job: ${job.id}`);
      } else {
        console.log(" Job not found or not dead.");
      }
      process.exit(0);
    }

    // ---------------- CONFIG SET ----------------
    if (cmd === "config" && argv[1] === "set") {
      const key = argv[2];
      const value = argv[3];
      if (!key || !value) {
        console.error("Usage: node queuectl.js config set <key> <value>");
        process.exit(1);
      }
      await storage.updateConfig(key, value);
      console.log(` Updated config: ${key} = ${value}`);
      process.exit(0);
    }

    // ---------------- UNKNOWN COMMAND ----------------
    console.error("Unknown command:", cmd);
    showHelp();
  } catch (err) {
    console.error(" Error:", err.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
QueueCTL (PowerShell-compatible CLI Job Queue)

Commands:
  node queuectl.js enqueue "{\"id\":\"job1\",\"command\":\"echo hi\"}"
  node queuectl.js enqueue-file job.json
  node queuectl.js list --state pending
  node queuectl.js status
  node queuectl.js dlq list
  node queuectl.js dlq retry job1
  node queuectl.js config set max_retries 5
`);
}

main();
