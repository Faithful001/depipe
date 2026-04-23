import { Request, Response } from "express";
import { deploymentService } from "./deployment.service";
import { deploymentRepository } from "./deployment.repository";
import { sse } from "../../core/sse";
import "dotenv/config";
import { logRepository } from "../log/log.repository";
import { deploySchema, zipDeploySchema } from "./dto/deploy.dto";

class DeploymentController {
  async deploy(req: Request, res: Response) {
    try {
      const result = deploySchema.safeParse(req.body);
      if (!result.success) {
        const issues = JSON.parse(result.error.message);
        return res.status(400).json({
          success: false,
          message: issues.map((e: { message: string }) => e.message).join(", "),
        });
      }

      const { gitUrl, env } = result.data;
      const containerId = await deploymentService.deploy({ type: "git", gitUrl }, env);

      if (!containerId) {
        return res.status(500).json({ success: false, message: "Deployment failed" });
      }

      return res.status(200).json({ success: true, containerId });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async deployZip(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No zip file uploaded" });
      }

      const result = zipDeploySchema.safeParse(req.body);
      if (!result.success) {
        const issues = JSON.parse(result.error.message);
        return res.status(400).json({
          success: false,
          message: issues.map((e: { message: string }) => e.message).join(", "),
        });
      }

      const { imageName, env } = result.data;
      const parsedEnv = env ? JSON.parse(env) : undefined;

      const containerId = await deploymentService.deploy(
        { type: "zip", zipPath: req.file.path, imageName },
        parsedEnv
      );

      if (!containerId) {
        return res.status(500).json({ success: false, message: "Deployment failed" });
      }

      return res.status(200).json({ success: true, containerId });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  getAll(req: Request, res: Response) {
    try {
      const deployments = deploymentRepository.findAll();
      const deploymentsWithUrl = deployments.map((d) => ({
        ...d,
        url: d.status === "running" ? `http://${d.image}.localhost` : null,
      }));
      return res.status(200).json({ success: true, deployments: deploymentsWithUrl });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  getLogs(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const deployment = deploymentRepository.findById(deploymentId as string);
      if (!deployment) {
        return res.status(404).json({ success: false, message: "Deployment not found" });
      }
      const logs = logRepository.findByDeploymentId(deploymentId as string);
      return res.status(200).json({ success: true, logs });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  streamLogs(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const deployment = deploymentRepository.findById(deploymentId as string);
      if (!deployment) {
        return res.status(404).json({ success: false, message: "Deployment not found" });
      }
      sse.addClient(deploymentId as string, res);
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const deploymentController = new DeploymentController();
