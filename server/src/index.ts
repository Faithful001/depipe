import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import deployRouter from "./modules/deployment/deployment.router";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use("/api", deployRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
