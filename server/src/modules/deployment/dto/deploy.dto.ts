import { z } from "zod";

export const deploySchema = z.object({
  gitUrl: z.string().url("Please enter a valid Git URL"),
  containerPort: z.coerce.number().int().min(1).max(65535),
  env: z.record(z.string(), z.string()).optional(),
});

export type DeployInput = z.infer<typeof deploySchema>;
