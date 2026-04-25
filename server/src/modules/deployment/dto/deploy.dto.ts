import { z } from "zod";

export const deploySchema = z.object({
  gitUrl: z.string().url("Please enter a valid Git URL"),
  env: z.record(z.string(), z.string()).optional(),
});

export const zipDeploySchema = z.object({
  imageName: z
    .string()
    .min(1, "Image name is required")
    .regex(/^[a-z0-9-]+$/, "Image name must be lowercase letters, numbers and hyphens only"),
  env: z.string().optional(),
});

export type DeployInput = z.infer<typeof deploySchema>;
export type ZipDeployInput = z.infer<typeof zipDeploySchema>;
