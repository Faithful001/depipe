import db from "../../db/database";

export type DeploymentStatus = "pending" | "building" | "deploying" | "running" | "failed";

export interface Deployment {
  id: string;
  image: string;
  git_url: string | null;
  container_port: number | null;
  status: DeploymentStatus; // DeploymentStatus
  container_id: string | null;
  host_port: number | null;
  created_at: Date;
}

class DeploymentRepository {
  async create({
    image,
    status,
    git_url,
    container_port,
  }: {
    image: string;
    status?: DeploymentStatus;
    git_url?: string | null;
    container_port?: number;
  }): Promise<Deployment> {
    const deployment = await db.deployment.create({
      data: {
        image,
        status: status ?? "pending",
        git_url: git_url ?? null,
        container_port: container_port ?? null,
      },
    });

    return deployment as Deployment;
  }

  async findById(id: string): Promise<Deployment | null> {
    const deployment = await db.deployment.findUnique({
      where: { id },
    });
    return deployment as Deployment | null;
  }

  async findByStatus(status: DeploymentStatus): Promise<Deployment[]> {
    const deployments = await db.deployment.findMany({
      where: { status },
    });
    return deployments as Deployment[];
  }

  async findByImage(image: string): Promise<Deployment[]> {
    const deployments = await db.deployment.findMany({
      where: { image },
      orderBy: { created_at: "desc" },
    });
    return deployments as Deployment[];
  }

  async findAll(): Promise<Deployment[]> {
    const deployments = await db.deployment.findMany({
      orderBy: { created_at: "desc" },
    });
    return deployments as Deployment[];
  }

  async update(
    id: string,
    data: Partial<Omit<Deployment, "id" | "created_at" | "image">>
  ): Promise<void> {
    await db.deployment.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, status: DeploymentStatus): Promise<void> {
    await db.deployment.update({
      where: { id },
      data: { status },
    });
  }

  async updateContainerId(id: string, containerId: string): Promise<void> {
    await db.deployment.update({
      where: { id },
      data: { container_id: containerId },
    });
  }

  async updateHostPort(id: string, hostPort: number): Promise<void> {
    await db.deployment.update({
      where: { id },
      data: { host_port: hostPort },
    });
  }

  async updateContainerPort(id: string, containerPort: number): Promise<void> {
    await db.deployment.update({
      where: { id },
      data: { container_port: containerPort },
    });
  }
}

export const deploymentRepository = new DeploymentRepository();
