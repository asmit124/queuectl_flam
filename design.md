#Objective

QueueCTL is a CLI-based background job queue system built with Node.js. It manages background jobs, retries failed ones with exponential backoff, and moves permanently failed jobs to a Dead Letter Queue (DLQ).

\---

#System Components

| Component | Description |

\|------------|-------------|

| \*\*queuectl.js\*\* | Command Line Interface that handles job management commands like `enqueue`, `list`, `status`, `dlq`, and `config`. |

| \*\*worker\_process.js\*\* | Worker script that picks pending jobs from the queue, executes them, retries on failure, and moves unrecoverable jobs to DLQ. |

| \*\*lib/storage.js\*\* | Handles reading/writing job data and configuration to a persistent JSON file (`db.json`). |

\---

#Job Lifecycle

\```

enqueue → pending → processing → completed / failed → dead

\```

| State | Description |

\|--------|-------------|

| `pending` | Job is waiting to be processed. |

| `processing` | Job is currently being executed by a worker. |

| `completed` | Job finished successfully. |

| `failed` | Job execution failed, but will retry automatically. |

| `dead` | Job permanently failed after reaching `max\_retries` and is moved to DLQ. |

\---

#Retry and Backoff Logic

QueueCTL implements \*\*exponential backoff\*\* for retries:

\```

delay = backoff\_base ^ attempts

\```

Example (base = 2):

| Attempt | Delay (seconds) |

\|----------|-----------------|

| 1 | 2 |

| 2 | 4 |

| 3 | 8 |

If the job still fails after `max\_retries`, it’s marked as `dead`.

\---

#Data Persistence

All job and configuration data is stored in a local `db.json` file. It is created automatically when the first job is enqueued.

\*\*Example:\*\*

\```json

{

"jobs": [

{

"id": "job1",

"command": "echo Hello World",

"state": "pending",

"attempts": 0,

"max\_retries": 3

}

],

"config": {

"max\_retries": 3,

"backoff\_base": 2

}

}

\```

This allows the queue to persist between runs and survive restarts.

\---

#CLI Commands

| Command | Description |

\|----------|-------------|

| `enqueue` | Add a new job inline with JSON |

| `enqueue-file` | Add a job using a `.json` file |

| `list --state` | List jobs by status (`pending`, `processing`, etc.) |

| `status` | Show a quick summary of job states |

| `dlq list` | Display jobs in Dead Letter Queue |

| `dlq retry <jobId>` | Move a DLQ job back to pending |

| `config set <key> <value>` | Change retry or backoff configuration |

\---

#Design Principles

- Built using \*\*plain Node.js\*\* (no frameworks)
- Uses \*\*modular structure\*\* — CLI, worker, and storage are separated
- Designed for \*\*cross-platform use\*\* (PowerShell and Linux compatible)
- Stores all data in simple \*\*JSON\*\* format for easy debugging and persistence

\---

\# Future Improvements

- Support for multiple worker processes
- Replace JSON storage with Redis or SQLite
- Add job scheduling and priority queue
- Implement REST API for external management
- Add log monitoring for job outputs
