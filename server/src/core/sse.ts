import { Response } from "express";

class SSE {
  private channels: Map<string, Set<Response>> = new Map();

  addClient(deploymentId: string, res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    if (!this.channels.has(deploymentId)) {
      this.channels.set(deploymentId, new Set());
    }

    const clients = this.channels.get(deploymentId)!;
    clients.add(res);

    res.on("close", () => {
      clients.delete(res);
      if (clients.size === 0) {
        this.channels.delete(deploymentId);
      }
    });
  }

  private write(deploymentId: string, data: object) {
    const clients = this.channels.get(deploymentId);
    if (clients) {
      for (const client of clients) {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    }
  }

  emit(deploymentId: string, message: string) {
    this.write(deploymentId, { type: "log", message });
  }

  emitTime(deploymentId: string, time: number) {
    this.write(deploymentId, { type: "time", time });
  }

  emitStatus(deploymentId: string, status: string) {
    this.write(deploymentId, { type: "status", status });
    // also broadcast to global channel with deploymentId included
    this.write("all", { type: "status", deploymentId, status });
  }
}

export const sse = new SSE();
