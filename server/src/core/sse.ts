import { Response } from "express";

class SSE {
  private clients: Map<string, Response> = new Map();

  addClient(deploymentId: string, res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    this.clients.set(deploymentId, res);

    res.on("close", () => {
      this.clients.delete(deploymentId);
    });
  }

  emit(deploymentId: string, data: string) {
    const client = this.clients.get(deploymentId);
    if (client) {
      client.write(`data: ${JSON.stringify({ message: data })}\n\n`);
    }
  }
}

export const sse = new SSE();
