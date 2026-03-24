import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeStatus = "completed" | "in_progress" | "pending" | "maintenance" | "cancelled" | "inactive";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
}

const statusClasses: Record<BadgeStatus, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-sky-100 text-sky-700",
  pending: "bg-slate-100 text-slate-600",
  maintenance: "bg-violet-100 text-violet-700",
  cancelled: "bg-red-100 text-red-700",
  inactive: "bg-red-100 text-red-700",
};

export function Badge({ className, status, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors",
        statusClasses[status],
        className
      )}
      {...props}
    />
  );
}
