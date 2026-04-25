import { Router } from "express";
import { deploymentController } from "./deployment.controller";
import { upload } from "../../core/upload";

const router = Router();

router.post("/deployments", (req, res) => deploymentController.deploy(req, res));
router.post("/deployments/zip", upload.single("file"), (req, res) =>
  deploymentController.deployZip(req, res)
);
router.post("/deployments/:deploymentId/cancel", (req, res) =>
  deploymentController.cancelDeployment(req, res)
);
router.get("/deployments", (req, res) => deploymentController.getAll(req, res));
router.get("/deployments/:deploymentId", (req, res) => deploymentController.getById(req, res));
router.get("/deployments/:deploymentId/logs", (req, res) => deploymentController.getLogs(req, res));

export default router;
