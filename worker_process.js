// worker_process.js - Windows-safe job worker
const { exec } = require("child_process");
const storage = require("./lib/storage");

let isRunning = true;

async function processJob(job) {
  console.log(`⚙️  Processing job ${job.id}: ${job.command}`);

  return new Promise((resolve) => {
    const start = Date.now();

    exec(job.command, { shell: true }, async (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Job ${job.id} failed: ${stderr || error.message}`);

        const attempts = job.attempts + 1;
        if (attempts < job.max_retries) {
          const delay = Math.pow(2, attempts) * 1000; // exponential backoff
          const scheduledAt = new Date(Date.now() + delay).toISOString();

          await storage.updateJob(job.id, {
            state: "failed",
            attempts,
            scheduled_at: scheduledAt,
          });

          console.log(
            `🔁 Retrying job ${job.id} in ${delay / 1000} seconds (attempt ${attempts})`
          );
        } else {
          await storage.updateJob(job.id, { state: "dead" });
          console.log(`☠️  Job ${job.id} moved to DLQ after max retries`);
        }
        return resolve();
      }

      // success
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`✅ Job ${job.id} completed in ${duration}s`);
      await storage.updateJob(job.id, { state: "completed" });
      resolve();
    });
  });
}

async function workerLoop() {
  console.log("👷 Worker started. Press Ctrl+C to stop.");

  while (isRunning) {
    const job = await storage.pickJobAndMarkProcessing();

    if (!job) {
      // No pending job → small sleep
      await new Promise((res) => setTimeout(res, 2000));
      continue;
    }

    await processJob(job);
  }

  console.log("👋 Worker shutting down...");
}

process.on("SIGINT", () => {
  console.log("\nGracefully stopping worker...");
  isRunning = false;
});

workerLoop();
