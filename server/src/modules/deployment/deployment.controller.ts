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
          data: null,
        });
      }

      const { gitUrl, env } = result.data;
      console.log(`Starting deployment for: ${gitUrl}`);
      const { id: deploymentId } = await deploymentService.deploy({ type: "git", gitUrl }, env);

      return res.status(200).json({
        success: true,
        message: "Deployment started",
        data: { deploymentId },
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Deployment error: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message, data: null });
    }
  }

  async deployZip(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No zip file uploaded", data: null });
      }

      const result = zipDeploySchema.safeParse(req.body);
      if (!result.success) {
        const issues = JSON.parse(result.error.message);
        return res.status(400).json({
          success: false,
          message: issues.map((e: { message: string }) => e.message).join(", "),
          data: null,
        });
      }

      const { imageName, env } = result.data;
      const parsedEnv = env ? JSON.parse(env) : undefined;

      const { id: deploymentId } = await deploymentService.deploy(
        { type: "zip", zipPath: req.file.path, imageName },
        parsedEnv
      );

      return res.status(200).json({
        success: true,
        message: "Deployment started",
        data: { deploymentId },
      });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message, data: null });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const deployments = await deploymentRepository.findAll();
      const deploymentsWithUrl = deployments.map((d) => ({
        ...d,
        url: d.status === "running" ? `http://${d.image}.localhost` : null,
      }));
      return res.status(200).json({
        success: true,
        data: { deployments: deploymentsWithUrl },
        message: "Deployments fetched successfully",
      });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message, data: null });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const deployment = await deploymentRepository.findById(deploymentId as string);
      if (!deployment) {
        return res
          .status(404)
          .json({ success: false, message: "Deployment not found", data: null });
      }
      const deploymentWithUrl = {
        ...deployment,
        url: deployment.status === "running" ? `http://${deployment.image}.localhost` : null,
      };
      return res.status(200).json({
        success: true,
        message: "Deployment fetched successfully",
        data: { deployment: deploymentWithUrl },
      });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message, data: null });
    }
  }

  async getLogs(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const deployment = await deploymentRepository.findById(deploymentId as string);
      if (!deployment) {
        return res
          .status(404)
          .json({ success: false, message: "Deployment not found", data: null });
      }
      const logs = await logRepository.findByDeploymentId(deploymentId as string);
      return res.status(200).json({
        success: true,
        message: "Logs fetched successfully",
        data: { logs },
      });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message, data: null });
    }
  }

  async streamLogs(req: Request, res: Response) {
    try {
      const { deploymentId } = req.params;
      const deployment = await deploymentRepository.findById(deploymentId as string);
      if (!deployment) {
        return res
          .status(404)
          .json({ success: false, message: "Deployment not found", data: null });
      }
      sse.addClient(deploymentId as string, res);
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(500).json({ success: false, message: error.message, data: null });
    }
  }
}

export const deploymentController = new DeploymentController();
