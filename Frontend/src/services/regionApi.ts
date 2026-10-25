const API_BASE = "http://127.0.0.1:8000";

export interface Region {
  id: string;
  name: string;
  type: string;
  parentRegionId?: string | null;
  parent?: string;
  parentName?: string;
  code?: string | null;
  active: boolean;
  hazardIds?: string[];
}

export interface Hazard {
  id: string;
  name: string;
  code?: string;
  description?: string;
  active?: boolean;
}

export interface RegionConfiguration {
  defaultRegionId: string | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.detail || `API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const regionApi = {
  async getRegions() {
    const result = await request<{
      items?: Region[];
      regions?: Region[];
      count?: number;
    }>("/api/regions?activeOnly=false&limit=500");

    const items = result.items ?? result.regions ?? [];

    return { items, count: result.count ?? items.length };
  },

async createRegion(data: {
  name: string;
  type: string;
  parentRegionId: string | null;
  code: string | null;
  active: boolean;
  hazardIds: string[];
}) {
  const result = await request<{ region: any }>("/api/regions", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return result.region;
},

  async updateRegion(id: string, data: Record<string, unknown>) {
    const result = await request<{ region: Region }>(
      `/api/regions/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );

    return result.region;
  },

  async deleteRegion(id: string) {
    return request<{ success: boolean; message: string }>(
      `/api/regions/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  },

  async getHazards() {
    const result = await request<{
      items?: Hazard[];
      hazards?: Hazard[];
      count?: number;
    }>("/api/hazard-types");

    const items = result.items ?? result.hazards ?? [];

    return { items, count: result.count ?? items.length };
  },

  async getConfiguration(): Promise<RegionConfiguration> {
    const result = await request<{
      configuration?: RegionConfiguration;
      defaultRegionId?: string | null;
    }>("/api/region-configuration");

    return (
      result.configuration ?? {
        defaultRegionId: result.defaultRegionId ?? null,
      }
    );
  },

  async saveConfiguration(config: RegionConfiguration) {
    // Check whether the Firestore configuration document already exists.
    const current = await request<{
      exists?: boolean;
      configuration?: RegionConfiguration;
      defaultRegionId?: string | null;
    }>("/api/region-configuration");

    // Existing document: update it. Missing document: create it.
    if (current.exists === true) {
      return request("/api/region-configuration", {
        method: "PUT",
        body: JSON.stringify(config),
      });
    }

    try {
      return await request("/api/region-configuration", {
        method: "POST",
        body: JSON.stringify(config),
      });
    } catch (error) {
      // Handle a concurrent create or a backend that doesn't return `exists`.
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("already exists")
      ) {
        return request("/api/region-configuration", {
          method: "PUT",
          body: JSON.stringify(config),
        });
      }

      throw error;
    }
  },
};
