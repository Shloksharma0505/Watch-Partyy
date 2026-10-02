// Single source of truth for who can do what.
export const ROLES = Object.freeze({
  HOST: 'host',
  MODERATOR: 'moderator',
  PARTICIPANT: 'participant',
  VIEWER: 'viewer', // alias of participant, shown separately in the UI
});

// Roles the host is allowed to hand out. "host" only moves via transfer_host.
export const ASSIGNABLE_ROLES = [ROLES.MODERATOR, ROLES.PARTICIPANT, ROLES.VIEWER];

const MATRIX = {
  [ROLES.HOST]: new Set(['control', 'assign_role', 'remove', 'transfer']),
  [ROLES.MODERATOR]: new Set(['control']),
  [ROLES.PARTICIPANT]: new Set(),
  [ROLES.VIEWER]: new Set(),
};

export const can = (role, permission) => MATRIX[role]?.has(permission) ?? false;
