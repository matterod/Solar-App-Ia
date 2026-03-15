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

    const res = await fetch(`${API_URL}/api/v1${path}`, { ...options, headers });

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
    getMe: () => request<{ id: string; email: string; full_name: string; role: string; company_id: string; company_name?: string | null; plan?: string | null; }>("/auth/me"),
};

/* ── Invitations ── */
export interface Invitation {
    id: string; company_id: string; email: string; role: string;
    status: string; created_at: string;
}
export interface ReceivedInvitation extends Invitation {
    company_name: string;
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
    tax_id?: string; address?: string; city?: string; province?: string; notes?: string;
    created_at: string;
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
    id: string; client_id: string; location_name: string; address: string;
    city?: string; province?: string; latitude?: number; longitude?: number;
    panel_count: number; panel_model?: string; inverter_model?: string; inverter_count: number;
    system_power_kw?: number; installation_date?: string; status: string;
    description?: string; created_at: string;
}
export interface InstallationDetail extends Installation {
    activities: Activity[];
    maintenance_records: Maintenance[];
    costs: Cost[];
}
export const installations = {
    list: (params?: { search?: string; status?: string; client_id?: string }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.status) qs.set("status", params.status);
        if (params?.client_id) qs.set("client_id", params.client_id);
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
    unit: string; current_stock: number; min_stock: number; unit_cost?: number;
    is_active: boolean; created_at: string;
}
export const products = {
    list: (params?: { search?: string; category?: string; low_stock?: boolean }) => {
        const qs = new URLSearchParams();
        if (params?.search) qs.set("search", params.search);
        if (params?.category) qs.set("category", params.category);
        if (params?.low_stock) qs.set("low_stock", "true");
        const q = qs.toString();
        return request<Product[]>(`/products/${q ? `?${q}` : ""}`);
    },
    create: (data: Partial<Product>) => request<Product>("/products/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

/* ── Maintenance ── */
export interface Maintenance {
    id: string; installation_id: string; scheduled_date: string; completed_date?: string;
    status: string; maintenance_type: string; description?: string; findings?: string;
    notification_sent: boolean; created_at: string;
}
export const maintenance = {
    list: (params?: { installation_id?: string; status?: string; upcoming_days?: number }) => {
        const qs = new URLSearchParams();
        if (params?.installation_id) qs.set("installation_id", params.installation_id);
        if (params?.status) qs.set("status", params.status);
        if (params?.upcoming_days) qs.set("upcoming_days", params.upcoming_days.toString());
        const q = qs.toString();
        return request<Maintenance[]>(`/maintenance/${q ? `?${q}` : ""}`);
    },
    create: (data: Partial<Maintenance>) => request<Maintenance>("/maintenance/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Maintenance>) => request<Maintenance>(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

/* ── Activities ── */
export interface Activity {
    id: string; installation_id: string; user_id?: string; title: string;
    description?: string; activity_date: string; duration_minutes?: number;
    created_at: string;
}
export const activities = {
    list: (installation_id?: string) => {
        const q = installation_id ? `?installation_id=${installation_id}` : "";
        return request<Activity[]>(`/activities/${q}`);
    },
    create: (data: Partial<Activity>) => request<Activity>("/activities/", { method: "POST", body: JSON.stringify(data) }),
};

/* ── Tasks ── */
export interface Task {
    id: string; installation_id?: string; title: string; description?: string;
    priority: string; status: string; assigned_to?: string; due_date?: string;
    completed_at?: string; created_at: string;
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
    low_stock_products: number;
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
    id: string; problem_id: string; description: string; created_at: string;
}
export interface Problem {
    id: string; title: string; description: string; status: string; tags: string[];
    created_at: string; updated_at: string; solutions: Solution[];
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
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
}
export const team = {
    list: () => request<TeamMember[]>("/team/"),
};

/* ── Costs ── */
export interface Cost {
    id: string;
    company_id: string;
    installation_id: string;
    cost_type: string;
    description?: string;
    amount: number;
    quantity: number;
    cost_date: string;
    created_by?: string;
    created_at: string;
}

export const costs = {
    list: (installation_id: string) => request<Cost[]>(`/costs/?installation_id=${installation_id}`),
    create: (data: Omit<Cost, "id" | "company_id" | "created_by" | "created_at">) =>
        request<Cost>("/costs/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/costs/${id}`, { method: "DELETE" }),
};


/* ── Plan & Usage ── */

export interface UsageDetail {
    used: number;
    limit: number | null;
}

export interface PlanUsage {
    plan: string;
    ai_questions: UsageDetail;
    clients: UsageDetail;
    installations: UsageDetail;
    team_members: UsageDetail;
}

export interface CompanyAdmin {
    id: string;
    name: string;
    plan: string;
    subscription_status: string;
    user_count: number;
    created_at: string;
}

export const plan = {
    usage: () => request<PlanUsage>("/plan/usage"),
};

export const admin = {
    companies: () => request<CompanyAdmin[]>("/admin/companies"),
    changePlan: (companyId: string, newPlan: string) =>
        request<CompanyAdmin>(`/admin/companies/${companyId}/plan`, {
            method: "PUT",
            body: JSON.stringify({ plan: newPlan }),
        }),
    stats: () => request<{ total_companies: number; total_users: number; demo_count: number; pro_count: number }>("/admin/stats"),
};
