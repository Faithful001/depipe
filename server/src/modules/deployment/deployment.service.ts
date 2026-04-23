import { spawn } from "node:child_process";
import { deploymentRepository } from "./deployment.repository";
import { sse } from "../../core/sse";
import { logRepository } from "../log/log.repository";
import { portRepository } from "../port/port.repository";
import simpleGit from "simple-git";
import path from "node:path";
import fs from "node:fs";

class DeploymentService {
  async deploy(
    gitUrl: string,
    containerPort: number,
    env?: Record<string, string>
  ): Promise<string | null> {
    const hostPort = portRepository.allocatePort();

    const image = gitUrl.split("/")[gitUrl.split("/").length - 1].split(".")[0];

    // pending
    const deployment = deploymentRepository.create({
      image,
      status: "pending",
      git_url: gitUrl,
      container_port: containerPort,
      env: env,
    });
    sse.emit(deployment.id, "pending");

    try {
      // clone repo
      const src = await this.cloneRepo(gitUrl, image, deployment.id);

      // building
      deploymentRepository.updateStatus(deployment.id, "building");
      sse.emit(deployment.id, "building");
      await this.buildImage(src, image, deployment.id);

      // deploying
      deploymentRepository.updateStatus(deployment.id, "deploying");
      sse.emit(deployment.id, "deploying");
      const containerId = await this.runContainer({
        image,
        hostPort,
        containerPort,
        sourcePath: src,
        deploymentId: deployment.id,
        env,
      });

      deploymentRepository.updateContainerId(deployment.id, containerId);
      deploymentRepository.updateHostPort(deployment.id, hostPort);

      // running
      deploymentRepository.updateStatus(deployment.id, "running");
      sse.emit(deployment.id, "running");

      await this.reloadCaddy();

      // done
      return containerId;
    } catch (err: unknown) {
      portRepository.releasePort(hostPort);
      deploymentRepository.updateStatus(deployment.id, "failed");
      sse.emit(deployment.id, "failed");
      return null;
    }
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
    const envFlags = env
      ? Object.entries(env).flatMap(([key, value]) => ["-e", `${key}=${value}`])
      : [];

    const containerId = await this.runCommand(
      "docker",
      ["run", "-d", "-p", `${hostPort}:${containerPort}`, ...envFlags, image],
      sourcePath,
      deploymentId
    );
    return containerId.trim();
  }

  public async reloadCaddy(): Promise<void> {
    const runningDeployments = deploymentRepository.findByStatus("running");

    const routes = runningDeployments.map((deployment) => ({
      match: [{ host: [`${deployment.image}.localhost`] }],
      handle: [
        {
          handler: "reverse_proxy",
          upstreams: [{ dial: `localhost:${deployment.host_port}` }],
        },
      ],
    }));

    const config = {
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

    const response = await fetch("http://localhost:2019/load", {
      method: "POST",
      body: JSON.stringify(config),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to reload Caddy: ${response.status}`);
    }
  }

  private async buildImage(src: string, image: string, deploymentId: string): Promise<void> {
    this.log(`Building image ${image}...`, deploymentId);
    await this.runCommand("railpack", ["build", ".", "--name", image], src, deploymentId);
    this.log("Build complete", deploymentId);
  }

  private async cloneRepo(gitUrl: string, image: string, deploymentId: string): Promise<string> {
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
