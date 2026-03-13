/** Type definitions for the Solar ERP API */

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: "admin" | "partner" | "installer" | "accountant";
    is_active: boolean;
    phone?: string;
    avatar_url?: string;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    tax_id?: string;
    address?: string;
    city?: string;
    province?: string;
    notes?: string;
    created_at: string;
}

export interface Installation {
    id: string;
    client_id: string;
    location_name: string;
    address: string;
    city?: string;
    province?: string;
    latitude?: number;
    longitude?: number;
    panel_count: number;
    panel_model?: string;
    inverter_model?: string;
    inverter_count: number;
    system_power_kw?: number;
    installation_date?: string;
    status: "pending" | "in_progress" | "completed" | "maintenance" | "inactive";
    description?: string;
    created_at: string;
}

export interface Activity {
    id: string;
    installation_id: string;
    user_id?: string;
    title: string;
    description?: string;
    activity_date: string;
    duration_minutes?: number;
    created_at: string;
}

export interface MaintenanceRecord {
    id: string;
    installation_id: string;
    scheduled_date: string;
    completed_date?: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    maintenance_type: string;
    description?: string;
    findings?: string;
    notification_sent: boolean;
    created_at: string;
}

export interface PendingTask {
    id: string;
    installation_id?: string;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high" | "urgent";
    status: "pending" | "in_progress" | "completed" | "cancelled";
    assigned_to?: string;
    due_date?: string;
    completed_at?: string;
    created_at: string;
}

export interface Product {
    id: string;
    name: string;
    sku?: string;
    description?: string;
    category?: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    unit_cost?: number;
    is_active: boolean;
    created_at: string;
}

export interface DashboardStats {
    total_clients: number;
    total_installations: number;
    active_installations: number;
    total_power_kw: number;
    upcoming_maintenance: number;
    pending_tasks: number;
    low_stock_products: number;
}

export interface AgentMessage {
    message: string;
    context?: Record<string, unknown>;
}

export interface AgentResponse {
    response: string;
    tool_calls: unknown[];
    metadata?: Record<string, unknown>;
}
