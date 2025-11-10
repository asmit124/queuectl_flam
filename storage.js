const fs = require("fs");
const path = require("path");

const DB_PATH = path.resolve(__dirname, "..", "db.json");

// ----------------------------------------------------
// Database helpers
// ----------------------------------------------------
function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { jobs: [], config: { max_retries: 3, backoff_base: 2 } };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

function loadSync() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw);
}

function saveSync(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ----------------------------------------------------
// Job management
// ----------------------------------------------------
async function createJob(job) {
  const db = loadSync();
  const now = new Date().toISOString();
  const newJob = {
    id: job.id,
    command: job.command,
    state: "pending",
    attempts: 0,
    max_retries: db.config.max_retries,
    created_at: now,
    updated_at: now,
  };
  db.jobs.push(newJob);
  saveSync(db);
  return newJob;
}

async function listJobsByState(state) {
  const db = loadSync();
  return db.jobs.filter((j) => j.state === state);
}

async function listAll() {
  const db = loadSync();
  return db.jobs;
}

// ----------------------------------------------------
// Worker helpers
// ----------------------------------------------------
async function pickJobAndMarkProcessing() {
  const db = loadSync();

  // pick a pending or retryable failed job
  const job = db.jobs.find(
    (j) =>
      j.state === "pending" ||
      (j.state === "failed" && new Date(j.scheduled_at || 0) <= new Date())
  );

  if (!job) return null;

  job.state = "processing";
  job.updated_at = new Date().toISOString();
  saveSync(db);
  return job;
}

async function updateJob(id, updates) {
  const db = loadSync();
  const job = db.jobs.find((j) => j.id === id);
  if (!job) return null;

  Object.assign(job, updates);
  job.updated_at = new Date().toISOString();
  saveSync(db);
  return job;
}

// ----------------------------------------------------
// Config management
// ----------------------------------------------------
async function updateConfig(key, value) {
  const db = loadSync();
  db.config[key] = isNaN(value) ? value : Number(value);
  saveSync(db);
  return db.config;
}

module.exports = {
  createJob,
  listJobsByState,
  listAll,
  pickJobAndMarkProcessing,
  updateJob,
  updateConfig,
};
