export const GLOBAL_STOCK_ROLES = [
  "owner",
  "admin",
  "manager",
  "cashier",
  "sales",
  "warehouse",
  "accountant",
  "viewer"
] as const;

export type GlobalStockRole = (typeof GLOBAL_STOCK_ROLES)[number];

const ALL_ROLES = [...GLOBAL_STOCK_ROLES];

export const MODULE_ACCESS: Record<string, readonly GlobalStockRole[]> = {
  overview: ALL_ROLES,
  pos: ["owner", "admin", "manager", "cashier", "sales"],
  online: ["owner", "admin"],
  inventory: ["owner", "admin", "manager", "warehouse", "viewer"],
  charts: ["owner", "admin", "manager", "accountant"],
  purchases: ["owner", "admin", "manager", "warehouse", "accountant"],
  suppliers: ["owner", "admin", "manager", "accountant"],
  activities: ALL_ROLES,
  documents: ["owner", "admin", "manager", "accountant"],
  notes: [
    "owner",
    "admin",
    "manager",
    "cashier",
    "sales",
    "warehouse",
    "accountant"
  ],
  operations: ["owner", "admin", "manager", "warehouse", "accountant"],
  settings: ["owner", "admin"]
};

export const OPERATIONS_TAB_ACCESS: Record<
  string,
  readonly GlobalStockRole[]
> = {
  cash: ["owner", "admin", "manager", "cashier", "accountant"],
  customers: ["owner", "admin", "manager", "cashier", "sales"],
  expenses: ["owner", "admin", "accountant"],
  locations: ["owner", "admin", "manager", "warehouse"],
  purchases: ["owner", "admin", "manager", "warehouse", "accountant"],
  team: ["owner", "admin"],
  advanced: ["owner", "admin"]
};

export const BUSINESS_SUITE_TAB_ACCESS: Record<
  string,
  readonly GlobalStockRole[]
> = {
  operations: ["owner", "admin", "manager", "warehouse", "accountant"],
  finance: ["owner", "admin", "accountant"],
  crm: ["owner", "admin", "manager"],
  projects: ["owner", "admin", "manager"],
  people: ["owner", "admin"]
};

const PRIMARY_MODULES: Record<GlobalStockRole, readonly string[]> = {
  owner: ["overview", "pos", "inventory", "operations"],
  admin: ["overview", "pos", "inventory", "operations"],
  manager: ["overview", "pos", "inventory", "purchases", "operations"],
  cashier: ["overview", "pos"],
  sales: ["overview", "pos"],
  warehouse: ["overview", "inventory", "purchases"],
  accountant: ["overview", "documents", "operations"],
  viewer: ["overview", "inventory"]
};

export function normalizeRole(role: string): GlobalStockRole {
  return GLOBAL_STOCK_ROLES.includes(role as GlobalStockRole)
    ? (role as GlobalStockRole)
    : "viewer";
}

export function canAccess(
  access: Record<string, readonly GlobalStockRole[]>,
  resource: string,
  role: string,
  demoMode = false
) {
  if (demoMode) return true;
  return (access[resource] ?? []).includes(normalizeRole(role));
}

export function canAccessModule(
  moduleId: string,
  role: string,
  demoMode = false
) {
  return canAccess(MODULE_ACCESS, moduleId, role, demoMode);
}

export function primaryModulesForRole(
  role: string,
  demoMode = false
): readonly string[] {
  return demoMode
    ? PRIMARY_MODULES.owner
    : PRIMARY_MODULES[normalizeRole(role)];
}

export function canAccessOperationTab(
  tab: string,
  role: string,
  demoMode = false
) {
  return canAccess(OPERATIONS_TAB_ACCESS, tab, role, demoMode);
}

export function canAccessBusinessSuiteTab(
  tab: string,
  role: string,
  demoMode = false
) {
  return canAccess(BUSINESS_SUITE_TAB_ACCESS, tab, role, demoMode);
}
