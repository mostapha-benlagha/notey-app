import { useProjectsStore } from "@/store/useProjectsStore";
import { Select } from "@/components/ui/select";

export function ProjectSelector({
  value,
  onChange,
  includeAutoOption = false,
  includeNoProjectOption = true,
}: {
  value: string;
  onChange: (value: string) => void;
  includeAutoOption?: boolean;
  includeNoProjectOption?: boolean;
}) {
  const projects = useProjectsStore((state) => state.projects);

  return (
    <Select aria-label="Project selector" value={value} onChange={(event) => onChange(event.target.value)} className="sm:max-w-[220px]">
      {includeAutoOption ? <option value="auto">Auto</option> : null}
      {includeNoProjectOption ? <option value="">No project</option> : null}
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  );
}
