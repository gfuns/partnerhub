import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface BrandingResponse {
  success: boolean;
  data: Record<string, any> | null;
  message?: string;
}

class BrandingService {
  async getBrandingBySubdomain(subdomain: string): Promise<BrandingResponse> {
    const url = `${API_BASE}/api/partner-hub/public/branding/${encodeURIComponent(subdomain)}`;
    const resp = await axios.get(url, { timeout: 15000 });
    return resp.data as BrandingResponse;
  }
}

export const brandingService = new BrandingService();
export default brandingService;
