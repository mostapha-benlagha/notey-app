import { cn } from "@/lib/utils";

export function Avatar({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary",
        className,
      )}
    >
      {label.slice(0, 2).toUpperCase()}
    </div>
  );
}
