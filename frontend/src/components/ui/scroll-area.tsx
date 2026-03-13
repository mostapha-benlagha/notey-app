import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function ScrollArea({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("overflow-y-auto", className)}>{children}</div>;
}
