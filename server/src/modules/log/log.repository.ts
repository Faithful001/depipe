import db from "../../db/database";

class LogRepository {
  async insert(deploymentId: string, message: string): Promise<void> {
    await db.log.create({
      data: {
        deployment_id: deploymentId,
        message,
      },
    });
  }

  async findByDeploymentId(
    deploymentId: string
  ): Promise<{ id: number; message: string; created_at: Date }[]> {
    const logs = await db.log.findMany({
      where: { deployment_id: deploymentId },
      orderBy: { id: "asc" },
    });
    return logs;
  }
}

export const logRepository = new LogRepository();
