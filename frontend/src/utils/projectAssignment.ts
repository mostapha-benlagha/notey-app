import type { Project } from "@/types/project.types";

interface AutoProjectResolution {
  projectId: string;
  createdProject: Project | null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreProjectMatch(content: string, project: Project) {
  const haystack = normalize(content);
  const keywords = normalize(`${project.name} ${project.description}`)
    .split(" ")
    .filter((word) => word.length > 2);

  if (!keywords.length) {
    return 0;
  }

  const matched = keywords.filter((keyword) => haystack.includes(keyword)).length;
  return matched / keywords.length;
}

function extractTopicLabel(content: string) {
  const normalized = content
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const candidate = normalized
    .replace(/^(?:i need to|i should|i want to|we need to|we should|just|maybe)\s+/i, "")
    .split(/[.!?]/)[0]
    ?.split(/(?:,|\band\b|\bthen\b)/i)[0]
    ?.trim();

  if (!candidate || candidate.length < 4) {
    return null;
  }

  const cleaned = candidate
    .replace(/^(?:buy|do|prepare|create|plan|review|write|fix|meet(?:ing)? with|call|sync with)\s+/i, "")
    .trim();

  const source = cleaned || candidate;
  const words = source.split(/\s+/).filter(Boolean).slice(0, 4);
  if (!words.length) {
    return null;
  }

  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function resolveAutoProject(input: { content: string; projects: Project[] }): AutoProjectResolution {
  const rankedProjects = input.projects
    .map((project) => ({
      project,
      score: scoreProjectMatch(input.content, project),
    }))
    .sort((left, right) => right.score - left.score);

  const bestMatch = rankedProjects[0];
  if (bestMatch && bestMatch.score >= 0.5) {
    return {
      projectId: bestMatch.project.id,
      createdProject: null,
    };
  }

  const topicLabel = extractTopicLabel(input.content);
  if (topicLabel && topicLabel.length >= 4) {
    const id = slugify(topicLabel);
    if (id && !input.projects.some((project) => project.id === id)) {
      return {
        projectId: id,
        createdProject: {
          id,
          name: topicLabel,
          description: "Auto-created from note context.",
          color: "bg-stone-500",
        },
      };
    }
  }

  return {
    projectId: "",
    createdProject: null,
  };
}
