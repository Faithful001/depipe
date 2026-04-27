# Depipe

A single-page deployment pipeline that takes a Git URL or a zipped project and turns it into a running, publicly accessible container. Built for the Brimble engineering take-home task.

## Submission Checklist

- [x] Public GitHub repo
- [x] `docker-compose.yml` that brings up the full stack on a clean machine
- [x] README with setup instructions, architecture notes, and design
- [x] Live log streaming over SSE
- [x] Railpack builds produce runnable images
- [x] Caddy fronts every deployment with hostname-based routing
- [x] Loom walkthrough
- [x] Brimble deploy + written feedback

## Loom Walkthrough

> https://www.loom.com/share/b218e568fb9b42749cfab86c25388261

The walkthrough covers the full deployment flow from submitting a Git URL to visiting the live app, live log streaming in action, the log drawer with redeploy, and a quick tour of the codebase structure.

## Quick Start

You need Docker and Docker Compose. That is it.

```bash
git clone https://github.com/Faithful001/depipe.git
cd depipe
docker compose up --build
```

Open `http://localhost:3000` in your browser. Chrome or Firefox works best for `*.localhost` subdomain resolution.

To test the pipeline, use any public GitHub repo or compress a project to a `.zip` and upload it directly.

## System Design

The full system design diagram is available here:

**[View on draw.io](https://drive.google.com/file/d/1Q7rLxAHCCHnczpZDbBt_BQsfh9YePA68/view)**

> After opening the link, click the **"Open with draw.io"** button at the top of the page to view the interactive diagram.

At a high level, the flow looks like this:

```
Browser
  -> Vite + TanStack frontend         :3000
    -> Express API                    :4000
      -> Deployment queue             (returns early, runs pipeline in background)
        -> Git clone or ZIP extract   (source lands in /repos/<image>)
          -> railpack prepare         (detects framework + port from build plan)
            -> railpack build         (produces Docker image via BuildKit)
              -> docker run           (container starts on allocated port 4001-5000)
                -> Caddy Admin API    (routes <image>.localhost to container)
                  -> SSE              (streams status + logs to browser in real time)
```

## What It Does

- Submit a Git URL or upload a ZIP file to trigger a deployment
- Railpack detects the framework and builds a Docker image with zero configuration
- The container starts and gets a unique host port assigned automatically
- Caddy is updated via its Admin API to route `<image>.localhost` to the running container
- Build and deploy logs stream live to the UI over SSE and persist in SQLite so you can scroll back after the fact
- Environment variables are stored in Vault, not in the database
- Failed deployments can be retried directly from the log drawer

## Stack

| Layer    | Technology                                                     |
| -------- | -------------------------------------------------------------- |
| Frontend | Vite + React + TanStack Router + TanStack Query + Tailwind CSS |
| Backend  | Node.js + TypeScript + Express + Prisma + SQLite               |
| Pipeline | Railpack + Docker + BuildKit                                   |
| Ingress  | Caddy (dynamically configured via Admin API)                   |
| Secrets  | HashiCorp Vault (dev mode)                                     |
| Queue    | BullMQ + Redis                                                 |

## Key Design Decisions

**BullMQ + Redis for the deployment queue.** An in-memory queue would have worked for this task, but a real PaaS does not run on a single process. Deployments need to survive server restarts, scale across workers, and recover from crashes, and that requires a durable queue. BullMQ with Redis is the natural fit and reflects how this would actually be built in production. The cost is one extra container.

**Queue-based deployments.** The `POST /api/deployments` endpoint adds the job to the BullMQ queue and returns immediately with the deployment ID. The pipeline runs in the background via a dedicated worker. This keeps the API responsive, prevents long-running builds from blocking the event loop, and means the client can start streaming logs right away without waiting for the build to finish.

**Automatic port detection.** Instead of asking the user what port their app runs on, the pipeline runs `railpack prepare` first to generate a build plan, reads the `PORT` variable from the plan, and uses that for the container mapping. Static sites get port 80 by default. Node apps, Go services, and anything else get whatever Railpack detects.

**Vault for environment variables.** Env vars are written to Vault at deploy time using the deployment ID as the key path (`secret/data/deployments/<id>`). They are read back from Vault just before `docker run` so they never touch SQLite or appear in logs. Vault runs in dev mode so no external account or setup is required.

**Dynamic Caddy routing.** The Caddyfile only configures the admin interface. All deployment routes are managed at runtime by posting to `http://caddy:2019/load`. Each deployment gets `<image>.localhost` mapped to `host.docker.internal:<hostPort>`. Reloads are atomic so existing traffic is not interrupted.

**SSE with typed events.** The event stream sends two event types: `log` for build output and `status` for pipeline state changes. The frontend handles them separately so the status badge updates in real time without polling the deployments endpoint.

**Single concurrency on the worker.** The BullMQ worker is set to concurrency: 1, meaning only one deployment runs at a time. Railpack builds are CPU and memory intensive, and running multiple simultaneously on a single machine would cause them to starve each other of resources and slow everything down. In production you would tune this number based on the available hardware per node, or distribute work across multiple machines each running their own worker.

**Persistent build cache via BuildKit.** Railpack builds through a dedicated BuildKit container mounted with a named volume so the layer cache survives restarts. The first build of a project is slow because base images and dependencies download from scratch. Every build after that reuses cached layers and completes significantly faster.

## Environment Variables

All defaults are baked into `docker-compose.yml` so no config files need to be created to run the project.

| Variable        | Default                       | Description                      |
| --------------- | ----------------------------- | -------------------------------- |
| `PORT`          | `4000`                        | API server port                  |
| `BUILDKIT_HOST` | `docker-container://buildkit` | BuildKit instance for Railpack   |
| `VAULT_ADDR`    | `http://vault:8200`           | Vault address                    |
| `VAULT_TOKEN`   | `root`                        | Vault root token (dev mode only) |
| `VITE_API_URL`  | `http://localhost:4000/api`   | API base URL for the frontend    |
| `REDIS_URL`     | `redis://redis:6379`          | Redis connection URL for BullMQ  |

## What I Would Do With More Time

**Zero-downtime redeploys.** Currently the old container is stopped before the new one starts. A proper blue-green swap would start the new container, wait for a health check to pass, switch the Caddy upstream, and then stop the old one. The current approach works but drops in-flight requests during the swap window.

**Resource limits.** No CPU or memory limits are enforced on deployed containers right now. In production you would want hard limits per deployment to prevent one noisy container from starving the others.

**WebSocket upgrade.** SSE is one-way. Upgrading to WebSockets would open the door for interactive terminal access directly into a running container, which would be genuinely useful for debugging.

**Proper migrations.** Prisma's `db push` works fine for development but a real migration history would make schema changes safer and easier to reason about across environments.

## Brimble Feedback

> https://pearls-and-grey-concierge.brimble.app/

I connected my GitHub account and deployed a landing page to test the platform.

The connect-with-GitHub flow is smooth and the zero-config build experience is genuinely impressive. Selecting a repo and hitting deploy without writing a single config file is exactly what developers want. The platform picked up my project type automatically and had it running without any intervention from me. The core loop works well.

The most notable issue I ran into was receiving an email notification saying my project was live while the deployment was still in the in-progress state. That kind of premature notification is confusing. It sets an expectation that the app is ready when it is not. If a user follows that link before the deployment finishes, they hit a dead end. The notification should only fire once the deployment is actually serving traffic.

If I had to prioritize one fix it would be the notification timing. Getting that wrong erodes trust in the platform faster than almost any other issue, because it is the first thing a new user experiences after a successful deploy.

---

Rough time spent: 12-15 hours across planning, building, debugging, and writing this up.
