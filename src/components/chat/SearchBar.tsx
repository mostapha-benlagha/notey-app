import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="Search notes"
        className="pl-10"
        placeholder="Search notes, tags, or projects..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
