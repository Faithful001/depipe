import { spawn } from "node:child_process";
import { deploymentRepository } from "./deployment.repository";
import { sse } from "../../core/sse";
import { logRepository } from "../log/log.repository";
import { portRepository } from "../port/port.repository";
import simpleGit from "simple-git";
import path from "node:path";
import fs from "node:fs";
import { vaultService } from "../../core/vault";

class DeploymentService {
  async deploy(
    source: { type: "git"; gitUrl: string } | { type: "zip"; zipPath: string; imageName: string },
    env?: Record<string, string>
  ): Promise<string | null> {
    const image =
      source.type === "git" ? source.gitUrl.split("/").pop()!.split(".")[0] : source.imageName;

    const sameImageHostPort = deploymentRepository.findByImage(image)?.[0]?.host_port;

    console.log("sameImageHostPort", sameImageHostPort);

    const hostPort = sameImageHostPort || portRepository.allocatePort();

    console.log("hostPort", hostPort);

    const deployment = deploymentRepository.create({
      image,
      status: "pending",
      git_url: source.type === "git" ? source.gitUrl : null,
    });
    sse.emit(deployment.id, "pending");

    try {
      if (env && Object.keys(env).length > 0) {
        await vaultService.storeEnv(deployment.id, env);
        this.log("Environment variables stored in Vault", deployment.id);
      }

      // get source code
      let src: string;
      if (source.type === "git") {
        src = await this.cloneRepo(source.gitUrl, image, deployment.id);
      } else {
        src = await this.extractUpload(source.zipPath, image, deployment.id);
      }

      // building
      deploymentRepository.updateStatus(deployment.id, "building");
      sse.emit(deployment.id, "building");
      const containerPort = await this.buildImage(src, image, deployment.id);
      deploymentRepository.updateContainerPort(deployment.id, containerPort);

      // deploying
      deploymentRepository.updateStatus(deployment.id, "deploying");
      sse.emit(deployment.id, "deploying");

      const storedEnv = env ? await vaultService.getEnv(deployment.id) : undefined;

      // stop old running containers for this image
      const oldDeployments = deploymentRepository
        .findByImage(image)
        .filter((d) => d.id !== deployment.id && d.status === "running");

      for (const old of oldDeployments) {
        if (old.container_id) {
          try {
            this.log(
              `Stopping old container ${old.container_id.substring(0, 8)}...`,
              deployment.id
            );
            await this.runCommand("docker", ["stop", old.container_id], src, deployment.id);
            await this.runCommand("docker", ["rm", old.container_id], src, deployment.id);
            // only release port if we aren't reusing it for the new container
            if (old.host_port && old.host_port !== hostPort) {
              portRepository.releasePort(old.host_port);
            }
          } catch {
            console.log(`Failed to cleanup old container ${old.container_id}`);
          }
        }
      }

      const containerId = await this.runContainer({
        image,
        hostPort,
        containerPort,
        sourcePath: src,
        deploymentId: deployment.id,
        env: storedEnv,
      });

      deploymentRepository.updateContainerId(deployment.id, containerId);
      deploymentRepository.updateHostPort(deployment.id, hostPort);
      deploymentRepository.updateStatus(deployment.id, "running");
      sse.emit(deployment.id, "running");

      await this.reloadCaddy();
      return containerId;
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error.message);
      portRepository.releasePort(hostPort);
      deploymentRepository.updateStatus(deployment.id, "failed");
      sse.emit(deployment.id, "failed");
      throw error;
    }
  }

  private async extractUpload(
    zipPath: string,
    image: string,
    deploymentId: string
  ): Promise<string> {
    const extractDir = path.join(process.cwd(), "repos", image);

    this.log(`Extracting upload...`, deploymentId);

    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      const unzip = spawn("unzip", ["-o", zipPath, "-d", extractDir], { cwd: extractDir });

      unzip.stdout.on("data", (data: Buffer) => {
        this.log(data.toString(), deploymentId);
      });

      unzip.stderr.on("data", (data: Buffer) => {
        this.log(data.toString(), deploymentId);
      });

      unzip.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`unzip exited with code ${code}`));
      });

      unzip.on("error", reject);
    });

    // delete zip after extraction
    fs.unlinkSync(zipPath);

    this.log("Extraction complete", deploymentId);

    // handle nested folder — if zip extracts to a single subfolder, use that
    const entries = fs.readdirSync(extractDir);
    if (entries.length === 1) {
      const nested = path.join(extractDir, entries[0]);
      if (fs.statSync(nested).isDirectory()) {
        return nested;
      }
    }

    return extractDir;
  }

  public async runContainer({
    image,
    hostPort,
    containerPort,
    sourcePath,
    deploymentId,
    env,
  }: {
    image: string;
    hostPort: number;
    containerPort: number;
    sourcePath: string;
    deploymentId: string;
    env?: Record<string, string>;
  }): Promise<string> {
    try {
      const envFlags = env
        ? Object.entries(env).flatMap(([key, value]) => ["-e", `${key}=${value}`])
        : [];

      const containerId = await this.runCommand(
        "docker",
        [
          "run",
          "-d",
          "-p",
          `${hostPort}:${containerPort}`,
          "-e",
          `PORT=${containerPort}`,
          ...envFlags,
          image,
        ],
        sourcePath,
        deploymentId
      );
      return containerId.trim();
    } catch (err: unknown) {
      const error = err as Error;
      this.log(error.message, deploymentId);
      throw err;
    }
  }

  public async reloadCaddy(): Promise<void> {
    const runningDeployments = deploymentRepository.findByStatus("running");

    const routes = runningDeployments.map((deployment) => ({
      match: [{ host: [`${deployment.image}.localhost`] }],
      handle: [
        {
          handler: "reverse_proxy",
          upstreams: [{ dial: `host.docker.internal:${deployment.host_port}` }],
        },
      ],
    }));

    const config = {
      admin: {
        listen: "0.0.0.0:2019",
        origins: ["0.0.0.0:2019", "caddy:2019"],
      },
      apps: {
        http: {
          servers: {
            main: {
              listen: [":80"],
              routes,
            },
          },
        },
      },
    };

    const response = await fetch("http://caddy:2019/load", {
      method: "POST",
      body: JSON.stringify(config),
      headers: {
        "Content-Type": "application/json",
        Origin: "http://caddy:2019",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to reload Caddy: ${response.status}`);
    }
  }

  private async buildImage(src: string, image: string, deploymentId: string): Promise<number> {
    try {
      this.log(`Analysing project...`, deploymentId);

      // generate build plan to detect port
      await this.runCommand(
        "railpack",
        ["prepare", ".", "--plan-out", "railpack-plan.json", "--hide-pretty-plan"],
        src,
        deploymentId
      );

      // read plan and extract port
      const planPath = path.join(src, "railpack-plan.json");
      let containerPort = 80; // default

      if (fs.existsSync(planPath)) {
        const plan = JSON.parse(fs.readFileSync(planPath, "utf-8"));
        const portFromPlan = plan?.deploy?.variables?.PORT;
        if (portFromPlan) {
          containerPort = parseInt(portFromPlan);
          this.log(`Detected container port: ${containerPort}`, deploymentId);
        } else {
          this.log(`No port detected in plan, defaulting to ${containerPort}`, deploymentId);
        }
      }

      this.log(`Building image ${image}...`, deploymentId);
      await this.runCommand("railpack", ["build", ".", "--name", image], src, deploymentId);
      this.log("Build complete", deploymentId);

      return containerPort;
    } catch (err: unknown) {
      const error = err as Error;
      this.log(error.message, deploymentId);
      throw err;
    }
  }

  private async cloneRepo(gitUrl: string, image: string, deploymentId: string): Promise<string> {
    try {
      const cloneDir = path.join(process.cwd(), "repos", image);

      if (fs.existsSync(cloneDir)) {
        this.log("Pulling latest changes...", deploymentId);
        await simpleGit(cloneDir).pull();
        this.log("Pull complete", deploymentId);
      } else {
        fs.mkdirSync(cloneDir, { recursive: true });
        this.log(`Cloning ${gitUrl}...`, deploymentId);
        await simpleGit().clone(gitUrl, cloneDir);
        this.log("Clone complete", deploymentId);
      }

      return cloneDir;
    } catch (err: unknown) {
      const error = err as Error;
      this.log(error.message, deploymentId);
      throw err;
    }
  }

  private runCommand(
    command: string,
    args: string[],
    dir: string,
    deploymentId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const spawnProcess = spawn(command, args, {
        cwd: dir || undefined,
        env: {
          ...process.env,
          BUILDKIT_HOST: process.env.BUILDKIT_HOST,
        },
      });

      let output = "";

      spawnProcess.stdout.on("data", (data: Buffer) => {
        const message = data.toString();
        output += message;
        logRepository.insert(deploymentId, message);
        sse.emit(deploymentId, message);
      });

      spawnProcess.stderr.on("data", (data: Buffer) => {
        const message = data.toString();
        logRepository.insert(deploymentId, message);
        sse.emit(deploymentId, message);
      });

      spawnProcess.on("close", (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`${command} exited with code ${code}`));
        }
      });

      spawnProcess.on("error", (err) => {
        reject(err);
      });
    });
  }

  private log(message: string, deploymentId: string): void {
    logRepository.insert(deploymentId, message);
    sse.emit(deploymentId, message);
  }
}

export const deploymentService = new DeploymentService();
