import { Checkbox } from "@/components/ui/checkbox";

export function TaskStatusToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return <Checkbox aria-label="Toggle task status" checked={checked} onChange={onChange} />;
}
