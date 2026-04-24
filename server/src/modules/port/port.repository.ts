import db from "../../db/database";
import { Prisma } from "@prisma/client";

const START_PORT = 4001;
const END_PORT = 4020;

class PortRepository {
  async allocatePort(): Promise<number> {
    return await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const result = await tx.port.aggregate({
        _max: { port: true },
      });

      const maxPort = result._max.port;
      console.log("max port", maxPort);

      const nextPort = maxPort !== null ? maxPort + 1 : START_PORT;
      console.log("next port", nextPort);

      if (nextPort > END_PORT) {
        throw new Error("No available ports");
      }

      await tx.port.create({
        data: { port: nextPort },
      });

      return nextPort;
    });
  }

  async releasePort(port: number): Promise<void> {
    try {
      await db.port.delete({
        where: { port },
      });
    } catch (e) {
      // ignore error if the port doesn't exist
    }
  }
}

export const portRepository = new PortRepository();
