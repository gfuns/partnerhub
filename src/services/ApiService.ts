import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const LOGIN_TYPE_KEY = 'login_type';

/**
 * Get API prefix based on login type
 */
function getApiPrefix(): string {
  const loginType = localStorage.getItem(LOGIN_TYPE_KEY);
  return loginType === 'agent' ? '/api/agent-hub' : '/api/partner-hub';
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.setupInterceptors();
  }

  /**
   * Get the full URL with appropriate prefix based on login type
   */
  private getUrl(path: string): string {
    return getApiPrefix() + path;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token to requests
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors globally
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
          // Don't trigger logout for login/register endpoints - let them handle their own 401 errors
          const isAuthEndpoint = originalRequest.url?.includes('/login') || 
                                 originalRequest.url?.includes('/register') ||
                                 originalRequest.url?.includes('/logout');
          
          if (isAuthEndpoint) {
            // Return formatted error for auth endpoints
            return Promise.reject(this.handleError(error));
          }

          // If already retried or no token, logout
          if (originalRequest._retry || !this.getToken()) {
            this.handleUnauthorized();
            return Promise.reject(error);
          }

          // Try to refresh token
          if (this.isRefreshing) {
            // Queue the request if token refresh is in progress
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.refreshToken();
            this.processQueue(null);
            this.isRefreshing = false;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            this.isRefreshing = false;
            this.handleUnauthorized();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Process queued requests after token refresh
   */
  private processQueue(error: unknown): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  /**
   * Handle unauthorized errors - logout user
   */
  private handleUnauthorized(): void {
    this.clearTokens();
    
    // Dispatch custom event for logout
    window.dispatchEvent(new CustomEvent('auth:logout', { 
      detail: { reason: 'Token expired or invalid' } 
    }));

    // Redirect to login if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data as any;
      return {
        message: data?.message || data?.error || 'An error occurred',
        errors: data?.errors || {},
        status: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        message: 'No response from server. Please check your connection.',
        status: 0,
      };
    } else {
      // Error in request setup
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshToken(): Promise<void> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${getApiPrefix()}/refresh-token`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`,
          },
        }
      );

      const { token } = response.data.data;
      this.setToken(token);
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Token management methods
   */
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  public clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LOGIN_TYPE_KEY);
  }

  /**
   * HTTP Methods
   */

  /**
   * GET request
   */
  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(this.getUrl(url), config);
    return response.data;
  }

  /**
   * POST request with JSON data
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(this.getUrl(url), data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(this.getUrl(url), data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.patch(this.getUrl(url), data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(this.getUrl(url), config);
    return response.data;
  }

  /**
   * POST request with multipart/form-data (for file uploads)
   */
  public async postMultipart<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(this.getUrl(url), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  }

  /**
   * PUT request with multipart/form-data (for file uploads)
   */
  public async putMultipart<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(this.getUrl(url), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  }

  /**
   * Download file (blob response)
   */
  public async downloadFile(
    url: string,
    filename?: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    const response = await this.axiosInstance.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Get filename from response header or use provided filename
    const contentDisposition = response.headers['content-disposition'];
    const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
    link.download = filename || filenameMatch?.[1] || 'download';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Build query string from params object
   */
  public buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(`${key}[]`, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
