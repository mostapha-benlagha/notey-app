import { useProjectsStore } from "@/store/useProjectsStore";
import { Select } from "@/components/ui/select";

export function ProjectSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const projects = useProjectsStore((state) => state.projects);

  return (
    <Select aria-label="Project selector" value={value} onChange={(event) => onChange(event.target.value)} className="sm:max-w-[220px]">
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </Select>
  );
}
