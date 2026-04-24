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

  emit(deploymentId: string, data: string) {
    const clients = this.channels.get(deploymentId);
    if (clients) {
      for (const client of clients) {
        client.write(`data: ${JSON.stringify({ type: "log", message: data })}\n\n`);
      }
    }
  }

  emitStatus(deploymentId: string, status: string) {
    const clients = this.channels.get(deploymentId);
    if (clients) {
      for (const client of clients) {
        client.write(`data: ${JSON.stringify({ type: "status", status })}\n\n`);
      }
    }
  }
}

export const sse = new SSE();
