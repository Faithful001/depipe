import { Request, Response } from "express";
import { deploymentService } from "./deployment.service";
import { deploymentRepository } from "./deployment.repository";
import { sse } from "../../core/sse";
import "dotenv/config";
import { logRepository } from "../log/log.repository";
import { deploySchema } from "./dto/deploy.dto";

class DeploymentController {
  async deploy(req: Request, res: Response) {
    const result = deploySchema.safeParse(req.body);
    if (!result.success) {
      const issues = JSON.parse(result.error.message);
      return res.status(400).json({
        success: false,
        message: issues.map((e: { message: string }) => e.message).join(", "),
      });
    }

    const { containerPort, gitUrl, env } = result.data;

    const containerId = await deploymentService.deploy(gitUrl, containerPort, env);

    if (!containerId) {
      return res.status(500).json({ success: false, message: "Deployment failed" });
    }

    return res.status(200).json({ success: true, containerId });
  }

  getAll(req: Request, res: Response) {
    const deployments = deploymentRepository.findAll();
    const deploymentsWithUrl = deployments.map((d) => ({
      ...d,
      url: d.status === "running" ? `http://${d.image}.localhost` : null,
    }));
    return res.status(200).json({ success: true, deployments: deploymentsWithUrl });
  }

  getLogs(req: Request, res: Response) {
    const { deploymentId } = req.params;

    const deployment = deploymentRepository.findById(deploymentId as string);
    if (!deployment) {
      return res.status(404).json({ success: false, message: "Deployment not found" });
    }

    const logs = logRepository.findByDeploymentId(deploymentId as string);
    return res.status(200).json({ success: true, logs });
  }

  streamLogs(req: Request, res: Response) {
    const { deploymentId } = req.params;

    const deployment = deploymentRepository.findById(deploymentId as string);
    if (!deployment) {
      return res.status(404).json({ success: false, message: "Deployment not found" });
    }

    sse.addClient(deploymentId as string, res);
  }
}

export const deploymentController = new DeploymentController();
