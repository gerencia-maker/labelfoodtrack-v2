"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm dark:border-orange-900/30 dark:bg-slate-900 dark:text-slate-100",
          "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
