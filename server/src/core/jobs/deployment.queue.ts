import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://redis:6379", {
  maxRetriesPerRequest: null,
});

export const deploymentQueue = new Queue("deployments", { connection });

export interface DeploymentJobData {
  deploymentId: string;
  source: { type: "git"; gitUrl: string } | { type: "zip"; zipPath: string; imageName: string };
  env?: Record<string, string>;
}

export function createDeploymentWorker(processor: (job: Job<DeploymentJobData>) => Promise<void>) {
  return new Worker<DeploymentJobData>("deployments", processor, {
    connection,
    concurrency: 1,
  });
}

export const cancelledJobs = new Set<string>();

export function markForCancellation(deploymentId: string) {
  cancelledJobs.add(deploymentId);
}

export function isCancelled(deploymentId: string) {
  return cancelledJobs.has(deploymentId);
}

export function clearCancellation(deploymentId: string) {
  cancelledJobs.delete(deploymentId);
}
