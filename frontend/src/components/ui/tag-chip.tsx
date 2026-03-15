import { NoteyLogoMark } from "@/components/brand/NoteyLogo";
import { Badge, type BadgeProps } from "@/components/ui/badge";

interface TagChipProps extends Omit<BadgeProps, "children"> {
  tag: string;
}

export function TagChip({ tag, className, variant = "outline", ...props }: TagChipProps) {
  return (
    <Badge variant={variant} className={className} {...props}>
      <NoteyLogoMark className="h-3 w-auto" aria-hidden />
      {tag}
    </Badge>
  );
}
