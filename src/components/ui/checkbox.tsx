import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-5 w-5 rounded-md border border-border text-primary focus:ring-2 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
