import { TagChip } from "@/components/ui/tag-chip";

export function TagBadge({ tag }: { tag: string }) {
  return <TagChip tag={tag} variant="accent" />;
}
