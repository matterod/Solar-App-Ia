/** API client configuration */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

export interface ApiError {
    detail: string;
}

class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    constructor() {
        this.baseUrl = `${API_BASE}${API_PREFIX}`;
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== "undefined") {
            localStorage.setItem("solar_erp_token", token);
        }
    }

    getToken(): string | null {
        if (!this.token && typeof window !== "undefined") {
            this.token = localStorage.getItem("solar_erp_token");
        }
        return this.token;
    }

    clearToken() {
        this.token = null;
        if (typeof window !== "undefined") {
            localStorage.removeItem("solar_erp_token");
        }
    }

    private get headers(): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        const token = this.getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    }

    async get<T>(path: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(`${this.baseUrl}${path}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    url.searchParams.set(key, value);
                }
            });
        }
        const res = await fetch(url.toString(), { headers: this.headers });
        if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
        return res.json();
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: "POST",
            headers: this.headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
        return res.json();
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: "PUT",
            headers: this.headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
        return res.json();
    }

    async delete(path: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: "DELETE",
            headers: this.headers,
        });
        if (!res.ok) throw new Error((await res.json()).detail || "Request failed");
    }
}

export const api = new ApiClient();
