/** Solar ERP — Centralized API Client */

import { auth as firebaseAuth } from "@/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    if (firebaseAuth.currentUser) {
        return await firebaseAuth.currentUser.getIdToken();
    }
    return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res: Response;
    try {
        res = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });
    } catch (networkError) {
        throw new Error("No se pudo conectar con el servidor. Asegurate de que el backend (FastAPI) esté corriendo en el puerto 8000.");
    }
    if (res.status === 401) {
        // Token auth failed
        throw new Error("Sesión expirada");
    }

    if (res.status === 204) return undefined as T;

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error del servidor");
    return data as T;
}

/* ── Auth ── */
export const auth = {
    getMe: () => request<{ id: string; email: string; fullName: string; role: string; companyId: string; companyName?: string | null; plan?: string | null; }>("/auth/me"),
};

/* ── Invitations ── */
export interface Invitation {
    id: string; companyId: string; email: string; role: string;
    status: string; createdAt: string;
}
export interface ReceivedInvitation extends Invitation {
    companyName: string;
}
export const invitations = {
    list: () => request<Invitation[]>("/invitations/"),
    create: (data: { email: string; role: string }) => request<Invitation>("/invitations/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/invitations/${id}`, { method: "DELETE" }),
    received: () => request<ReceivedInvitation[]>("/invitations/received"),
    accept: (id: string) => request<{ detail: string }>(`/invitations/${id}/accept`, { method: "POST" }),
    reject: (id: string) => request<{ detail: string }>(`/invitations/${id}/reject`, { method: "POST" }),
};

/* ── Clients ── */
export interface Client {
    id: string; name: string; email?: string; phone?: string; company?: string;
    taxId?: string; address?: string; city?: string; province?: string; notes?: string;
    createdAt: string;
}
export const clients = {
    list: (search?: string) => request<Client[]>(`/clients/${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    get: (id: string) => request<Client>(`/clients/${id}`),
    create: (data: Partial<Client>) => request<Client>("/clients/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Client>) => request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/clients/${id}`, { method: "DELETE" }),
};

/* ── Installations ── */
export interface Installation {
    id: string; clientId: string; locationName: string; address: string;
    city?: string; province?: string; latitude?: number; longitude?: number;
    panelCount: number; panelModel?: string; inverterModel?: string; inverterCount: number;
    systemPowerKw?: number; installationDate?: string; status: string;
    description?: string; createdAt: string;
}
export interface InstallationDetail extends Installation {
    activities: Activity[];
    maintenanceRecords: Maintenance[];
    costs: Cost[];
}
export const installations = {
    list: (params?: { search?: string; status?: string; clientId?: string }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.status) qs.set("status", params.status);
        if (params?.clientId) qs.set("clientId", params.clientId);
        const q = qs.toString();
        return request<Installation[]>(`/installations/${q ? `?${q}` : ""}`);
    },
    get: (id: string) => request<InstallationDetail>(`/installations/${id}`),
    create: (data: Partial<Installation>) => request<Installation>("/installations/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Installation>) => request<Installation>(`/installations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/installations/${id}`, { method: "DELETE" }),
};

/* ── Products ── */
export interface Product {
    id: string; name: string; sku?: string; description?: string; category?: string;
    unit: string; currentStock: number; minStock: number; unitCost?: number;
    salePrice?: number; isActive: boolean; createdAt: string;
}
export const products = {
    list: (params?: { search?: string; category?: string; lowStock?: boolean; sort?: string }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.category) qs.set("category", params.category);
        if (params?.lowStock) qs.set("lowStock", "true");
        if (params?.sort) qs.set("sort", params.sort);
        const q = qs.toString();
        return request<Product[]>(`/products/${q ? `?${q}` : ""}`);
    },
    create: (data: Partial<Product>) => request<Product>("/products/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

/* ── Maintenance ── */
export interface Maintenance {
    id: string; installationId: string; scheduledDate: string; completedDate?: string;
    status: string; maintenanceType: string; description?: string; findings?: string;
    notificationSent: boolean; createdAt: string;
}
export const maintenance = {
    list: (params?: { installationId?: string; status?: string; upcomingDays?: number }) => {
        const qs = new URLSearchParams();
        if (params?.installationId) qs.set("installationId", params.installationId);
        if (params?.status) qs.set("status", params.status);
        if (params?.upcomingDays) qs.set("upcomingDays", params.upcomingDays.toString());
        const q = qs.toString();
        return request<Maintenance[]>(`/maintenance/${q ? `?${q}` : ""}`);
    },
    create: (data: Partial<Maintenance>) => request<Maintenance>("/maintenance/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Maintenance>) => request<Maintenance>(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

/* ── Activities ── */
export interface Activity {
    id: string; installationId: string; userId?: string; title: string;
    description?: string; activityDate: string; durationMinutes?: number;
    createdAt: string;
}
export const activities = {
    list: (installationId?: string) => {
        const q = installationId ? `?installationId=${installationId}` : "";
        return request<Activity[]>(`/activities/${q}`);
    },
    create: (data: Partial<Activity>) => request<Activity>("/activities/", { method: "POST", body: JSON.stringify(data) }),
};

/* ── Tasks ── */
export interface Task {
    id: string; installationId?: string; title: string; description?: string;
    priority: string; status: string; assigned_to?: string; dueDate?: string;
    completedAt?: string; createdAt: string;
}
export const tasks = {
    list: (params?: { status?: string; priority?: string }) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.priority) qs.set("priority", params.priority);
        const q = qs.toString();
        return request<Task[]>(`/tasks/${q ? `?${q}` : ""}`);
    },
    create: (data: Partial<Task>) => request<Task>("/tasks/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Task>) => request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

/* ── Dashboard ── */
export interface DashboardStats {
    total_clients: number; total_installations: number; active_installations: number;
    total_power_kw: number; upcoming_maintenance: number; pending_tasks: number;
    lowStock_products: number;
}
export const dashboard = {
    stats: () => request<DashboardStats>("/dashboard/stats"),
};

/* ── Agent ── */
export interface AgentResponse {
    response: string;
    tool_calls: Array<{ tool: string; input: Record<string, unknown> }>;
    metadata?: Record<string, unknown>;
}
export const agent = {
    chat: (message: string, history: any[] = []) => request<AgentResponse>("/agent/chat", {
        method: "POST",
        body: JSON.stringify({ message, history }),
    }),
};

/* ── Problems ── */
export interface Solution {
    id: string; problem_id: string; description: string; createdAt: string;
}
export interface Problem {
    id: string; title: string; description: string; status: string; tags: string[];
    createdAt: string; updatedAt: string; solutions: Solution[];
}

export const problems = {
    list: (params?: { search?: string; status?: string }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.status) qs.set("status", params.status);
        const q = qs.toString();
        return request<Problem[]>(`/problems/${q ? `?${q}` : ""}`);
    },
    get: (id: string) => request<Problem>(`/problems/${id}`),
    create: (data: Partial<Problem>) => request<Problem>("/problems/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Problem>) => request<Problem>(`/problems/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    addSolution: (problem_id: string, description: string) => request<Solution>(`/problems/${problem_id}/solutions`, { method: "POST", body: JSON.stringify({ description }) }),
};

/* ── Team ── */
export interface TeamMember {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
}
export const team = {
    list: () => request<TeamMember[]>("/team/"),
};

/* ── Costs ── */
export interface Cost {
    id: string;
    companyId: string;
    installationId: string;
    cost_type: string;
    description?: string;
    amount: number;
    quantity: number;
    cost_date: string;
    created_by?: string;
    createdAt: string;
}

export const costs = {
    list: (installationId: string) => request<Cost[]>(`/costs/?installationId=${installationId}`),
    create: (data: Omit<Cost, "id" | "companyId" | "created_by" | "createdAt">) =>
        request<Cost>("/costs/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/costs/${id}`, { method: "DELETE" }),
};


/* ── Budgets (Presupuestos) ── */
export interface BudgetItem {
    id: string;
    budget_id: string;
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sortOrder: number;
}

export interface Budget {
    id: string;
    companyId: string;
    clientId?: string;
    installationId?: string;
    budget_number?: string;
    title: string;
    description?: string;
    subtotal: number;
    taxRate: number;
    tax_amount: number;
    total: number;
    status: "draft" | "sent" | "approved" | "rejected";
    validUntil?: string;
    notes?: string;
    items: BudgetItem[];
    created_by?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BudgetListItem {
    id: string;
    companyId: string;
    clientId?: string;
    installationId?: string;
    budget_number?: string;
    title: string;
    subtotal: number;
    taxRate: number;
    tax_amount: number;
    total: number;
    status: "draft" | "sent" | "approved" | "rejected";
    validUntil?: string;
    client_name?: string;
    installation_name?: string;
    createdAt: string;
    updatedAt: string;
}

export const budgets = {
    list: (params?: { status?: string; clientId?: string; installationId?: string; search?: string }) => {
        const qs = new URLSearchParams();
        if (params?.status) qs.set("status", params.status);
        if (params?.clientId) qs.set("clientId", params.clientId);
        if (params?.installationId) qs.set("installationId", params.installationId);
        if (params?.search) qs.set("search", params.search);
        const q = qs.toString();
        return request<BudgetListItem[]>(`/budgets/${q ? `?${q}` : ""}`);
    },
    get: (id: string) => request<Budget>(`/budgets/${id}`),
    create: (data: {
        clientId?: string;
        installationId?: string;
        title: string;
        description?: string;
        taxRate?: number;
        validUntil?: string;
        notes?: string;
        items: Array<{
            productId?: string;
            description: string;
            quantity: number;
            unitPrice: number;
            sortOrder?: number;
        }>;
    }) => request<Budget>("/budgets/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: {
        clientId?: string;
        installationId?: string;
        title?: string;
        description?: string;
        taxRate?: number;
        validUntil?: string;
        notes?: string;
        items?: Array<{
            productId?: string;
            description: string;
            quantity: number;
            unitPrice: number;
            sortOrder?: number;
        }>;
    }) => request<Budget>(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/budgets/${id}`, { method: "DELETE" }),
    updateStatus: (id: string, status: string) =>
        request<Budget>(`/budgets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    duplicate: (id: string) =>
        request<Budget>(`/budgets/${id}/duplicate`, { method: "POST" }),
    downloadPdf: async (id: string, filename?: string) => {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/v1/budgets/${id}/pdf`, { headers });
        if (!res.ok) throw new Error("Error al generar PDF");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "presupuesto.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
};

/* ── Plan & Usage ── */

export interface UsageDetail {
    used: number;
    limit: number | null;
}

export interface PlanUsage {
    plan: string;
    aiQuestions: UsageDetail;
    clients: UsageDetail;
    installations: UsageDetail;
    teamMembers: UsageDetail;
}

export interface CompanyAdmin {
    id: string;
    name: string;
    plan: string;
    subscriptionStatus: string;
    userCount: number;
    createdAt: string;
}

export const plan = {
    usage: () => request<PlanUsage>("/plan/usage"),
};

/* ── Telegram ── */
export interface TelegramLinkCode {
    code: string;
    expiresMinutes: number;
    botUsername: string;
}

export interface TelegramStatus {
    linked: boolean;
    telegramUsername?: string;
    linkedAt?: string;
}

export const telegram = {
    generateCode: () => request<TelegramLinkCode>("/telegram/link-code", { method: "POST" }),
    status: () => request<TelegramStatus>("/telegram/status"),
    unlink: () => request<void>("/telegram/link", { method: "DELETE" }),
};

export const admin = {
    companies: () => request<CompanyAdmin[]>("/admin/companies"),
    changePlan: (companyId: string, newPlan: string) =>
        request<CompanyAdmin>(`/admin/companies/${companyId}/plan`, {
            method: "PUT",
            body: JSON.stringify({ plan: newPlan }),
        }),
    stats: () => request<{ totalCompanies: number; totalUsers: number; demoCount: number; proCount: number }>("/admin/stats"),
};
