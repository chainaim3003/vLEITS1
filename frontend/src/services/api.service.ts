import axios from 'axios';
import type { TradingPartnerVerificationRequest, VerificationResponse, Agent } from '../types/api.types';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class VerificationService {
  static async verifyTradingPartner(request: TradingPartnerVerificationRequest): Promise<VerificationResponse> {
    const response = await apiClient.post<VerificationResponse>('/verify/trading-partner', request);
    return response.data;
  }

  static async getAgents(): Promise<{ success: boolean; agents: Agent[]; count: number }> {
    const response = await apiClient.get('/agents');
    return response.data;
  }

  static async healthCheck(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  }
}
