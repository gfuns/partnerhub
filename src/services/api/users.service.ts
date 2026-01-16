import apiService from '../ApiService';

export interface User {
  context_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  role_label: string;
  is_primary: boolean;
  status: string;
  user_status: string;
  last_login_at: string | null;
  created_at: string;
}

export interface UserDetail {
  context_id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    status: string;
    last_login_at: string | null;
  };
  role: string;
  role_label: string;
  permissions: string[];
  is_primary: boolean;
  status: string;
  created_at: string;
}

export interface UserListParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface Role {
  value: string;
  label: string;
  description: string;
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
}

export interface UpdateUserRequest {
  role?: string;
  status?: string;
}

class UsersService {
  /**
   * List staff users
   */
  async getUsers(params?: UserListParams): Promise<UserListResponse> {
    const queryString = params ? apiService.buildQueryString(params) : '';
    return apiService.get(`/users${queryString}`);
  }

  /**
   * Get available roles
   */
  async getRoles(): Promise<RolesResponse> {
    return apiService.get('/users/roles');
  }

  /**
   * Create/invite new user
   */
  async createUser(data: CreateUserRequest): Promise<any> {
    return apiService.post('/users', data);
  }

  /**
   * Get user details
   */
  async getUser(id: string): Promise<any> {
    return apiService.get(`/users/${id}`);
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<any> {
    return apiService.put(`/users/${id}`, data);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<any> {
    return apiService.delete(`/users/${id}`);
  }

  /**
   * Resend invitation email
   */
  async resendInvitation(id: string): Promise<any> {
    return apiService.post(`/users/${id}/resend-invitation`);
  }
}

export const usersService = new UsersService();
export default usersService;
