import type {
  PharmacyRoleCreated,
  PharmacyRoleRow,
  RolePermissionsPayload,
  RolePermissionsSavePayload,
  SettingsCommand,
  SettingsSubmitResult,
} from '@medmate/settings-contract';
import { createIdempotencyKey, hostApi } from '@/modules/api';
import { failureResult } from '@/modules/settings/lib/errors';

const ROLES_PATH = '/api/v1/pharmacy/roles';

function isNoContent(status: number): boolean {
  return status === 204;
}

export async function submitRoles(
  command: SettingsCommand,
): Promise<SettingsSubmitResult> {
  if (command.screen !== 'roles') {
    return { ok: false, formError: 'This screen cannot update roles.' };
  }
  switch (command.action) {
    case 'load': {
      const result = await hostApi.request<PharmacyRoleRow[]>({
        path: ROLES_PATH,
        method: 'GET',
      });
      if (!result.ok) {
        return failureResult(result.code, result.message, result.details);
      }
      const roles = Array.isArray(result.data) ? result.data : [];
      return { ok: true, roles };
    }
    case 'create': {
      const result = await hostApi.request<PharmacyRoleCreated>({
        path: ROLES_PATH,
        method: 'POST',
        body: {
          name: command.values.name,
          display_name: command.values.display_name,
          permissions: command.values.permissions,
        },
        idempotencyKey: createIdempotencyKey(),
      });
      if (!result.ok || !result.data) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, createdRole: result.data };
    }
    case 'delete': {
      const result = await hostApi.request({
        path: `${ROLES_PATH}/${command.values.id}`,
        method: 'DELETE',
        idempotencyKey: createIdempotencyKey(),
      });
      if (isNoContent(result.status) || result.ok) {
        return { ok: true };
      }
      return failureResult(result.code, result.message, result.details);
    }
    case 'loadPermissions': {
      const result = await hostApi.request<RolePermissionsPayload>({
        path: `${ROLES_PATH}/${command.values.id}/permissions`,
        method: 'GET',
      });
      if (!result.ok || !result.data) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, rolePermissions: result.data };
    }
    case 'savePermissions': {
      const result = await hostApi.request<RolePermissionsSavePayload>({
        path: `${ROLES_PATH}/${command.values.id}/permissions`,
        method: 'PUT',
        body: { permissions: command.values.permissions },
        idempotencyKey: createIdempotencyKey(),
      });
      if (!result.ok || !result.data) {
        return failureResult(result.code, result.message, result.details);
      }
      return { ok: true, savedPermissions: result.data };
    }
  }
}
