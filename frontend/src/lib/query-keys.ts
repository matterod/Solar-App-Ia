// Typed query key factory for React Query.
// All keys use `as const` tuples — never use raw string arrays at call sites.

export const queryKeys = {
  dashboard: {
    overview: ["dashboard", "overview"] as const,
    stats: () => ["dashboard", "stats"] as const,
  },

  clients: {
    all: () => ["clients"] as const,
    list: (filters: { search?: string; status?: string; page?: number }) =>
      ["clients", "list", filters] as const,
    detail: (id: string | number) => ["clients", "detail", id] as const,
  },

  installations: {
    all: () => ["installations"] as const,
    list: (filters: { search?: string; status?: string; client_id?: string; page?: number }) =>
      ["installations", "list", filters] as const,
    detail: (id: string | number) => ["installations", "detail", id] as const,
  },

  costs: {
    all: () => ["costs"] as const,
    byInstallation: (installationId: string | number) =>
      ["costs", installationId] as const,
  },

  activities: {
    all: () => ["activities"] as const,
    byInstallation: (installationId: string | number) =>
      ["activities", installationId] as const,
  },

  maintenance: {
    all: () => ["maintenance"] as const,
    list: (filters: { status?: string; installation_id?: string; upcoming_days?: number }) =>
      ["maintenance", "list", filters] as const,
    detail: (id: string | number) => ["maintenance", "detail", id] as const,
  },

  inventory: {
    all: () => ["inventory"] as const,
    list: (filters: { search?: string; category?: string; low_stock?: boolean; sort?: string; page?: number }) =>
      ["inventory", "list", filters] as const,
    detail: (id: string | number) => ["inventory", "detail", id] as const,
  },

  presupuestos: {
    all: () => ["presupuestos"] as const,
    list: (filters: { search?: string; status?: string; client_id?: string; installation_id?: string; page?: number }) =>
      ["presupuestos", "list", filters] as const,
    detail: (id: string | number) => ["presupuestos", "detail", id] as const,
  },

  tasks: {
    all: () => ["tasks"] as const,
    list: (filters: { status?: string; priority?: string }) =>
      ["tasks", "list", filters] as const,
    detail: (id: string | number) => ["tasks", "detail", id] as const,
  },

  problems: {
    all: () => ["problems"] as const,
    list: (filters: { search?: string; status?: string }) =>
      ["problems", "list", filters] as const,
    detail: (id: string | number) => ["problems", "detail", id] as const,
  },

  team: {
    all: () => ["team"] as const,
  },

  invitations: {
    all: () => ["invitations"] as const,
    received: () => ["invitations", "received"] as const,
  },

  plan: {
    usage: () => ["plan", "usage"] as const,
  },

  telegram: {
    status: () => ["telegram", "status"] as const,
  },

  admin: {
    companies: () => ["admin", "companies"] as const,
    stats: () => ["admin", "stats"] as const,
  },
};
