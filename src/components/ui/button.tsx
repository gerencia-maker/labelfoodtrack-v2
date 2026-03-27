import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-orange-400 to-orange-600 text-white border border-orange-500/50 shadow-[0_2px_8px_rgba(249,115,22,0.25),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:brightness-110 active:brightness-95 active:shadow-[0_1px_4px_rgba(249,115,22,0.2),inset_0_1px_2px_rgba(0,0,0,0.1)]",
        destructive:
          "bg-gradient-to-b from-red-500 to-red-700 text-white border border-red-600/50 shadow-[0_2px_8px_rgba(239,68,68,0.25),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:brightness-110 active:brightness-95",
        outline:
          "border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm text-slate-700 dark:text-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.5)] hover:bg-white/90 dark:hover:bg-slate-700/90 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] active:shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]",
        secondary:
          "bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 text-orange-700 dark:text-orange-300 border border-slate-200/80 dark:border-slate-600/50 shadow-[0_1px_4px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:brightness-105 active:brightness-95",
        ghost:
          "hover:bg-orange-50/80 dark:hover:bg-orange-500/10 hover:text-orange-700 dark:hover:text-orange-300 hover:shadow-[inset_0_0_0_1px_rgba(249,115,22,0.1)]",
        gradient:
          "bg-gradient-to-r from-orange-500 via-orange-600 to-rose-500 text-white border border-orange-500/30 shadow-[0_2px_12px_rgba(249,115,22,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:brightness-110 hover:shadow-[0_4px_16px_rgba(249,115,22,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] active:brightness-95 active:shadow-[0_1px_4px_rgba(249,115,22,0.2),inset_0_1px_2px_rgba(0,0,0,0.1)]",
        link: "text-orange-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
