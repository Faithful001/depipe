import { Router } from "express";
import { deploymentController } from "./deployment.controller";
import { upload } from "../../core/upload";

const router = Router();

router.post("/deployments", deploymentController.deploy);
router.post("/deployments/zip", upload.single("file"), deploymentController.deployZip);
router.get("/deployments", deploymentController.getAll);
router.get("/deployments/:deploymentId/logs", deploymentController.getLogs);

export default router;
