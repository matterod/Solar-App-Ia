"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("solar_token");
        if (!token) {
            router.push("/");
        } else {
            setIsAuth(true);
        }
    }, [router]);

    if (!isAuth) return null; // flash prevention

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64">
                <div className="gradient-mesh min-h-screen pt-14 md:pt-0">
                    {children}
                </div>
            </main>
        </div>
    );
}
