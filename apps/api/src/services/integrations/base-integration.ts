export interface IntegrationConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: any;
}

export abstract class BaseIntegration {
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract refreshTokens?(): Promise<IntegrationConfig>;

  protected async handleError(error: any): Promise<void> {
    console.error(`Integration error: ${error.message}`, error);
    throw error;
  }

  protected isTokenExpired(): boolean {
    if (!this.config.expiresAt) return false;
    return new Date() >= new Date(this.config.expiresAt);
  }

  async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired() && this.refreshTokens) {
      this.config = await this.refreshTokens();
    }
  }
}
