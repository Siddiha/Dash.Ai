// backend/src/services/integrations/base.integration.ts
export abstract class BaseIntegration {
  protected accessToken: string;
  protected refreshToken?: string;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  abstract testConnection(): Promise<boolean>;
  abstract refreshAccessToken(): Promise<string>;
}

