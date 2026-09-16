import {
  TargetConfig, TargetCreateRequest, TargetTestResponse,
  AttackTestCase, ScanRun, SecurityReport, ComparisonResponse, AttackResult
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth(): Promise<{ status: string; service: string; version: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Targets
  async getTargets(): Promise<TargetConfig[]> {
    const res = await fetch(`${API_BASE}/targets`);
    if (!res.ok) throw new Error('Failed to fetch targets');
    return res.json();
  },

  async createTarget(payload: TargetCreateRequest): Promise<TargetConfig> {
    const res = await fetch(`${API_BASE}/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create target');
    }
    return res.json();
  },

  async deleteTarget(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/targets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete target');
  },

  async testTarget(payload: Partial<TargetCreateRequest>): Promise<TargetTestResponse> {
    const res = await fetch(`${API_BASE}/targets/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Connection test failed');
    }
    return res.json();
  },

  // Attack Battery
  async getBattery(): Promise<AttackTestCase[]> {
    const res = await fetch(`${API_BASE}/battery`);
    if (!res.ok) throw new Error('Failed to fetch attack battery');
    return res.json();
  },

  async getCategories(): Promise<Record<string, { name: string; description: string; owasp: string; severity: string }>> {
    const res = await fetch(`${API_BASE}/battery/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Scans
  async startScan(payload: { target_id?: string; target_config?: TargetCreateRequest; attack_suite: string; enable_llm_judge?: boolean }): Promise<ScanRun> {
    const res = await fetch(`${API_BASE}/scans/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to start scan');
    }
    return res.json();
  },

  async getScanStatus(scanId: string): Promise<ScanRun> {
    const res = await fetch(`${API_BASE}/scans/${scanId}/status`);
    if (!res.ok) throw new Error('Failed to fetch scan status');
    return res.json();
  },

  async getScanResults(scanId: string): Promise<AttackResult[]> {
    const res = await fetch(`${API_BASE}/scans/${scanId}/results`);
    if (!res.ok) throw new Error('Failed to fetch scan results');
    return res.json();
  },

  async getScanHistory(): Promise<ScanRun[]> {
    const res = await fetch(`${API_BASE}/scans/history`);
    if (!res.ok) throw new Error('Failed to fetch scan history');
    return res.json();
  },

  // Reports
  async getReport(scanId: string): Promise<SecurityReport> {
    const res = await fetch(`${API_BASE}/reports/${scanId}`);
    if (!res.ok) throw new Error('Failed to fetch security report');
    return res.json();
  },

  getExportJsonUrl(scanId: string): string {
    return `${API_BASE}/reports/${scanId}/export/json`;
  },

  // Comparisons
  async compareScans(baseId: string, targetId: string): Promise<ComparisonResponse> {
    const res = await fetch(`${API_BASE}/comparison/${baseId}/${targetId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to compare scans');
    }
    return res.json();
  }
};
