const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kerb0sbhb2.execute-api.eu-central-1.amazonaws.com/prod';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<ApiResponse<T>> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string> || {}),
        },
      });
      return await response.json();
    } catch (error) {
      console.error(`API error (Versuch ${attempt + 1}/${retries + 1}):`, error);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      return { success: false, error: 'Server nicht erreichbar' };
    }
  }
  return { success: false, error: 'Server nicht erreichbar' };
}

export interface Spieltag {
  id: string;
  nr: number;
  datum: string;
  uhrzeit: string;
  heimmannschaft: string;
  gastmannschaft: string;
  heim: boolean;
}

export interface Spieler {
  id: string;
  pos: number;
  name: string;
  lk: string;
  kern: boolean;
}

export type Verfuegbarkeit = 'ja' | 'nein' | 'unsicher' | '';

export const api = {
  listSpieltage: () => request<Spieltag[]>('/spieltage'),
  listSpieler: () => request<Spieler[]>('/spieler'),
  getAllVerfuegbarkeit: () => request<Record<string, Record<string, string>>>('/verfuegbarkeit/alle'),
  setVerfuegbarkeit: (spieltagId: string, spielerId: string, status: Verfuegbarkeit) =>
    request<{ spieltagId: string; spielerId: string; status: string }>('/verfuegbarkeit', {
      method: 'POST',
      body: JSON.stringify({ spieltagId, spielerId, status }),
    }),
};
