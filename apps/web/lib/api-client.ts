class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = "API request failed";
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getWorkflows() {
    return this.request("/api/workflows");
  }

  async createWorkflow(workflow: any) {
    return this.request("/api/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(id: string, workflow: any) {
    return this.request(`/api/workflows/${id}`, {
      method: "PUT",
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request(`/api/workflows/${id}`, {
      method: "DELETE",
    });
  }

  async executeWorkflow(id: string) {
    return this.request(`/api/workflows/${id}/execute`, {
      method: "POST",
    });
  }
}

export const apiClient = new ApiClient();
