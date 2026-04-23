import db from "../../db/database";

db.exec(`
  CREATE TABLE IF NOT EXISTS ports (
    port INTEGER PRIMARY KEY
  );
`);

const START_PORT = 4001;
const END_PORT = 5000;

export const portRepository = {
  allocatePort(): number {
    const result = db.prepare(`SELECT MAX(port) as last_port FROM ports`).get() as {
      last_port: number | null;
    };

    const nextPort = result.last_port ? result.last_port + 1 : START_PORT;

    if (nextPort > END_PORT) {
      throw new Error("No available ports"); // limit to 1000 running containers for this lean version
    }

    db.prepare(`INSERT INTO ports (port) VALUES (?)`).run(nextPort);
    return nextPort;
  },

  releasePort(port: number): void {
    db.prepare(`DELETE FROM ports WHERE port = ?`).run(port);
  },
};
