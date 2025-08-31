export type IntegrationType =
  | "GMAIL"
  | "GOOGLE_CALENDAR"
  | "NOTION"
  | "SLACK"
  | "HUBSPOT"
  | "LINEAR"
  | "PHONE"
  | "GOOGLE_DRIVE"
  | "GOOGLE_SHEETS"
  | "GOOGLE_DOCS";

export interface Integration {
  id: string;
  userId: string;
  type: IntegrationType;
  name: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  lastSync?: string;
  category: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectIntegrationRequest {
  type: IntegrationType;
  name: string;
  authorizationCode?: string;
  metadata?: any;
}

export interface DisconnectIntegrationRequest {
  integrationId: string;
}
