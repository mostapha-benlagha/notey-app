import { Badge } from "@/components/ui/badge";

export function TagBadge({ tag }: { tag: string }) {
  return <Badge variant="accent">#{tag}</Badge>;
}
