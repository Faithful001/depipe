import { Job } from "bullmq";
import { createDeploymentWorker, type DeploymentJobData } from "./deployment.queue";
import { deploymentRepository } from "../../modules/deployment/deployment.repository";
import { deploymentService } from "../../modules/deployment/deployment.service";
import { sse } from "../sse";

const worker = createDeploymentWorker(async (job: Job<DeploymentJobData>) => {
  console.log("Worker called", job.data);
  const { deploymentId, source, env } = job.data;

  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) throw new Error(`Deployment ${deploymentId} not found`);

  try {
    await deploymentService.executeDeployment(deployment, source, env);
  } catch (err: unknown) {
    const error = err as Error;
    console.error(`Deployment ${deploymentId} failed:`, error.message);
    await deploymentRepository.updateStatus(deploymentId, "failed");
    sse.emitStatus(deploymentId, "failed");
  }
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

export default worker;
