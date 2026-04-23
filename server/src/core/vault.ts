import NodeVault from "node-vault";

class VaultService {
  vault = NodeVault({
    apiVersion: "v1",
    endpoint: process.env.VAULT_ADDR || "http://vault:8200",
    token: process.env.VAULT_TOKEN || "root",
  });

  async storeEnv(deploymentId: string, env: Record<string, string>): Promise<void> {
    try {
      await this.vault.write(`secret/data/deployments/${deploymentId}`, {
        data: env,
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.log(error);
      throw err;
    }
  }

  async getEnv(deploymentId: string): Promise<Record<string, string>> {
    try {
      const result = await this.vault.read(`secret/data/deployments/${deploymentId}`);
      if (!result) {
        return {};
      }
      return result.data.data as Record<string, string>;
    } catch (err: unknown) {
      // Return empty env if the secret doesn't exist (404)
      if (err && typeof err === "object" && "response" in err) {
        const vaultErr = err as { response: { statusCode: number } };
        if (vaultErr.response.statusCode === 404) {
          return {};
        }
      }
      throw err;
    }
  }

  async deleteEnv(deploymentId: string): Promise<void> {
    try {
      await this.vault.delete(`secret/data/deployments/${deploymentId}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.log(error);
      throw err;
    }
  }
}

export const vaultService = new VaultService();
