import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeStatus =
  | "completed"
  | "in_progress"
  | "pending"
  | "maintenance"
  | "cancelled"
  | "inactive"
  // Extended dark-mode variants
  | "active"
  | "approved"
  | "rejected"
  | "low_stock"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus;
}

const statusClasses: Record<BadgeStatus, string> = {
  // Existing statuses — migrated to dark-mode tokens
  completed: "bg-emerald-500/10 text-emerald-400",
  in_progress: "bg-sky-500/10 text-sky-400",
  pending: "bg-amber-500/10 text-amber-400",
  maintenance: "bg-violet-500/10 text-violet-400",
  cancelled: "bg-red-500/10 text-red-400",
  inactive: "bg-red-500/10 text-red-400",
  // Extended variants
  active: "bg-emerald-500/10 text-emerald-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  rejected: "bg-red-500/10 text-red-400",
  low_stock: "bg-red-500/10 text-red-400",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
  info: "bg-sky-500/10 text-sky-400",
  neutral: "bg-slate-500/10 text-slate-400",
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
