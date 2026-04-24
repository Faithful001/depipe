import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import deployRouter from "./modules/deployment/deployment.router";
import { deploymentController } from "./modules/deployment/deployment.controller";
import "./core/jobs/deployment.worker";

export const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use("/api", deployRouter);
app.get("/events/:deploymentId", (req, res) => deploymentController.streamLogs(req, res));

app.route("/health").get((_, res) => {
  return res.status(200).json({ success: true, message: "OK", data: null });
});

const PORT = process.env.PORT || 4000;

app.listen(Number(PORT), () => {
  console.log(`Server is running on port ${PORT}`);
});
