import express from "express";
import cors from "cors";
import "dotenv/config";
import deployRouter from "./modules/deployment/deployment.router";
import { deploymentController } from "./modules/deployment/deployment.controller";
import helmet from "helmet";
import "./core/jobs/deployment.worker";
import { sse } from "./core/sse";

export const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use("/api", deployRouter);
app.get("/events/all", (req, res) => {
  sse.addClient("all", res);
});
app.get("/events/:deploymentId", (req, res) => deploymentController.streamLogs(req, res));

app.route("/health").get((_, res) => {
  return res.status(200).json({ success: true, message: "OK", data: null });
});

const PORT = process.env.PORT || 4000;

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
