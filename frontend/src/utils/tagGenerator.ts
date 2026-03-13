const keywordMap: Record<string, string[]> = {
  meeting: ["meeting", "sync"],
  security: ["security", "audit", "incident"],
  task: ["todo", "task", "follow up", "prepare", "send"],
  research: ["research", "investigate", "prototype"],
  product: ["launch", "roadmap", "feature", "release"],
  personal: ["home", "family", "health", "journal"],
};

const fallbackTags = ["insight", "priority", "review"];

export function generateTags(content: string) {
  const normalized = content.toLowerCase();
  const matches = Object.entries(keywordMap)
    .filter(([, values]) => values.some((value) => normalized.includes(value)))
    .map(([tag]) => tag);

  return [...new Set(matches.length ? matches : fallbackTags)].slice(0, 4);
}

export function extractTasks(content: string) {
  const sentences = content
    .split(/[.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const taskLike = sentences.filter((sentence) =>
    /\b(prepare|send|review|follow up|ship|draft|schedule|finalize|create)\b/i.test(sentence),
  );

  return taskLike.slice(0, 2).map((task) => task.charAt(0).toUpperCase() + task.slice(1));
}
