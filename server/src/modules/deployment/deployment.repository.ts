import { randomUUID } from "node:crypto";
import db from "../../db/database";

export type DeploymentStatus = "pending" | "building" | "deploying" | "running" | "failed";

export interface Deployment {
  id: string;
  image: string;
  status: DeploymentStatus;
  container_id: string | null;
  host_port: number | null;
  created_at: string;
}

export const deploymentRepository = {
  create({
    image,
    status,
    git_url,
    container_port,
    env,
  }: {
    image: string;
    status?: DeploymentStatus;
    git_url?: string;
    container_port?: number;
    env?: Record<string, string>;
  }): Deployment {
    const id = randomUUID();
    db.prepare(
      `
    INSERT INTO deployments (id, image, status, git_url, container_port, env)
    VALUES (?, ?, ?, ?, ?, ?)
  `
    ).run(id, image, status ?? "pending", git_url, container_port, env);

    return this.findById(id)!;
  },

  findById(id: string): Deployment | null {
    return (db.prepare(`SELECT * FROM deployments WHERE id = ?`).get(id) as Deployment) ?? null;
  },

  findByStatus(status: DeploymentStatus): Deployment[] {
    return (
      (db.prepare(`SELECT * FROM deployments WHERE status = ?`).all(status) as Deployment[]) ?? []
    );
  },

  findAll(): Deployment[] {
    return db.prepare(`SELECT * FROM deployments ORDER BY created_at DESC`).all() as Deployment[];
  },

  update(id: string, data: Array<keyof Omit<Deployment, "id" | "created_at" | "image">>): void {
    const updateClause = data.map((key) => `${key} = ?`).join(", ");
    const query = `UPDATE deployments SET ${updateClause} WHERE id = ?`;
    const params = [...data, id];
    db.prepare(query).run(params);
  },

  updateStatus(id: string, status: DeploymentStatus): void {
    db.prepare(`UPDATE deployments SET status = ? WHERE id = ?`).run(status, id);
  },

  updateContainerId(id: string, containerId: string): void {
    db.prepare(`UPDATE deployments SET container_id = ? WHERE id = ?`).run(containerId, id);
  },

  updateHostPort(id: string, hostPort: number): void {
    db.prepare(`UPDATE deployments SET host_port = ? WHERE id = ?`).run(hostPort, id);
  },
};
