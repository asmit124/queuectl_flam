#QueueCTL — Node.js Background Job Queue

QueueCTL is a simple **CLI-based background job queue system** built with **Node.js**.  
It lets you enqueue background jobs, process them using a worker, and automatically retry failed ones with **exponential backoff**.  
Permanently failed jobs are stored in a **Dead Letter Queue (DLQ)**.


## How to Run the Project

###  Install Node.js
Make sure Node.js is installed:
```powershell
node -v
```

###  Open the Project Folder
```powershell
cd ~/Desktop/queuectl
```

###  Enqueue a New Job
```powershell
node .\queuectl.js enqueue-file .\job.json
```

###  Start the Worker
```powershell
node .\worker_process.js
```
The worker will automatically pick up and process jobs.

### Check Job Status
```powershell
node .\queuectl.js list --state completed
```

###  View Failed or DLQ Jobs
```powershell
node .\queuectl.js dlq list
```

---

### Project Structure
```
queuectl.js        → CLI commands
worker_process.js  → Worker runner
lib/storage.js     → Persistent storage
job.json           → Example job
fail.json          → Example failed job
db.json            → Auto-created database
architecture.md    → System overview
```


Working CLI demo link:
https://drive.google.com/file/d/1rOeidk0-g992-1F9cZC9vkupaLFbl6sE/view?usp=drive_link
