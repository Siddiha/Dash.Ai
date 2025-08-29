
// frontend/src/services/auth.ts
import { api } from "./api";

export const authService = {
  async googleAuth() {
    const response = await api.post("/auth/google");
    return response.data;
  },

  async googleCallback(code: string) {
    const response = await api.post("/auth/google/callback", { code });
    return response.data;
  },

  async getMe() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async logout() {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};



