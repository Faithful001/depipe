import db from "../../db/database";

export const logRepository = {
  insert(deploymentId: string, message: string): void {
    db.prepare(
      `
      INSERT INTO logs (deployment_id, message)
      VALUES (?, ?)
    `
    ).run(deploymentId, message);
  },

  findByDeploymentId(deploymentId: string): { id: number; message: string; created_at: string }[] {
    return db
      .prepare(
        `
      SELECT * FROM logs WHERE deployment_id = ? ORDER BY id ASC
    `
      )
      .all(deploymentId) as any[];
  },
};
