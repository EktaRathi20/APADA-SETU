
import { AuthUser, LoginResponse, OfficerUser, Role } from "@/types";
import { httpClient } from "./httpClient";



const TOKEN_KEY = "apada_access_token";

// The backend may return either { users: [...] } or [...].
type UserListResponse = OfficerUser[] | { users: OfficerUser[] };
type RoleListResponse = Role[] | { roles: Role[] };

export async function getUsers(): Promise<OfficerUser[]> {
  const result = await httpClient.get<UserListResponse>("/users");

  return Array.isArray(result) ? result : result.users;
}

export async function getRoles(): Promise<Role[]> {
  const result = await httpClient.get<RoleListResponse>("/roles");

  return Array.isArray(result) ? result : result.roles;
}

export async function login(
  userId: string,
): Promise<LoginResponse> {
  const result = await httpClient.post<
    LoginResponse,
    { user_id: string }
  >("/auth/login", {
    user_id: userId,
  });

  if (!result.access_token || !result.user) {
    throw new Error("The authentication service returned an invalid response.");
  }

  // Store the token only after a successful login response.
  sessionStorage.setItem(TOKEN_KEY, result.access_token);

  return result;
}

export async function verifyToken(): Promise<AuthUser> {
  const result = await httpClient.get<{ user: AuthUser }>("/auth/me");

  if (!result.user) {
    throw new Error("Unable to verify the current session.");
  }

  return result.user;
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}
