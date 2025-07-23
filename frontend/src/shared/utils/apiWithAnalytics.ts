import { analytics } from './analytics';

/**
 * API wrapper that automatically tracks API calls with analytics
 */
export class ApiWithAnalytics {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Make a GET request with analytics tracking
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Make a POST request with analytics tracking
   */
  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a PUT request with analytics tracking
   */
  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a DELETE request with analytics tracking
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Make a PATCH request with analytics tracking
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  /**
   * Make a request with analytics tracking
   */
  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const startTime = Date.now();
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';

    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      // Track API call
      analytics.trackApiCall(endpoint, method, response.status, duration);

      if (!response.ok) {
        // Track API error
        analytics.track('api_error', {
          endpoint,
          method,
          status: response.status,
          statusText: response.statusText,
          duration,
        });

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as T;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Track network error
      analytics.track('api_network_error', {
        endpoint,
        method,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      throw error;
    }
  }
}

// Create default instance
export const apiWithAnalytics = new ApiWithAnalytics();

export default apiWithAnalytics; 