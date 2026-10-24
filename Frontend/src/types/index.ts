export interface Role {
  id: string;
  name: string;
  level: number;
  description: string;
  isActive: boolean;
}

export interface OfficerUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  isActive: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  roleLevel: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}