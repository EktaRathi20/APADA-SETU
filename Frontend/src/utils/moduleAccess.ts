import type { AuthUser } from '../types';
import type { OperationalMode } from '../types/domain';

export type ModuleKey = OperationalMode | 'history' | 'alerts' | 'region-management';
type RoleKey = 'assessment' | 'planner' | 'field' | 'recovery' | 'rescue' | 'unknown';

export const SHARED_MODULES: ModuleKey[] = ['overview', 'history', 'alerts'];

const ROLE_MODULES: Record<RoleKey, ModuleKey[]> = {
  assessment: [...SHARED_MODULES, 'threat', 'tasks', 'fieldOps', 'landfall', 'recovery'],
  planner: [...SHARED_MODULES, 'threat', 'tasks'],
  field: [...SHARED_MODULES, 'tasks', 'fieldOps'],
  recovery: [...SHARED_MODULES, 'recovery'],
  rescue: [...SHARED_MODULES, 'tasks', 'landfall'],
  unknown: SHARED_MODULES,
};

function resolveRole(roleId?: string | number, roleName?: string, roleLevel?: number): RoleKey {
  const id = String(roleId ?? '').trim().toLowerCase();
  const name = String(roleName ?? '').trim().toLowerCase();

  const roleByValue: Record<string, RoleKey> = {
    role_1: 'assessment', '1': 'assessment', 'disaster assessment officer': 'assessment',
    role_2: 'planner', '2': 'planner', 'operations planner': 'planner',
    role_3: 'field', '3': 'field', 'field operations officer': 'field',
    role_4: 'recovery', '4': 'recovery', 'insurance recovery officer': 'recovery',
    role_5: 'rescue', '5': 'rescue', 'rescue relief officer': 'rescue',
  };

  if (roleByValue[name]) return roleByValue[name];
  if (roleByValue[id]) return roleByValue[id];
  if (roleLevel !== undefined && roleLevel >= 1 && roleLevel <= 5) {
    return roleByValue[String(roleLevel)] ?? 'unknown';
  }
  if (name.includes('disaster assessment') || name.includes('admin')) return 'assessment';
  if (name.includes('planner')) return 'planner';
  if (name.includes('field')) return 'field';
  if (name.includes('insurance') || name.includes('recovery')) return 'recovery';
  if (name.includes('rescue') || name.includes('relief')) return 'rescue';
  return 'unknown';
}

export function getAllowedModules(
  roleId?: string | number,
  roleName?: string,
  roleLevel?: number,
): ModuleKey[] {
  return [...ROLE_MODULES[resolveRole(roleId, roleName, roleLevel)], 'simulator', 'region-management'];
}

export function canAccessModule(user: AuthUser, module: ModuleKey): boolean {
  return getAllowedModules(user.roleId, user.roleName, user.roleLevel).includes(module);
}
