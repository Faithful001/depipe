import { Router } from "express";
import { deploymentController } from "./deployment.controller";

const router = Router();

router.post("/deployments", deploymentController.deploy);
router.get("/deployments", deploymentController.getAll);
router.get("/deployments/:deploymentId/logs", deploymentController.getLogs);

router.get("/events/:deploymentId", deploymentController.streamLogs);

export default router;
