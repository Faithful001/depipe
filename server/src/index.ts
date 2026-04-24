import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import deployRouter from "./modules/deployment/deployment.router";
import { deploymentController } from "./modules/deployment/deployment.controller";

export const app = express();

app.use((req, _res, next) => {
  process.stdout.write(`\n[TRAFFIC] ${req.method} ${req.url}\n`);
  next();
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: true,
  })
);

// app.use(helmet());
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
