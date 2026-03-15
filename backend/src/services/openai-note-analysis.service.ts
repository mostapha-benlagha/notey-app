import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

interface OpenAiNoteAnalysisInput {
  content: string;
  fallbackProjectId: string;
  recentProjectNotes: string[];
}

interface OpenAiNoteAnalysisResult {
  suggestedProjectId: string;
  tags: string[];
  todoTitles: string[];
  completedSignals: string[];
  prompt: string;
}

const actionStartPattern = /^(meet|meeting|call|sync|buy|do|prepare|send|review|follow up|ship|draft|schedule|finalize|create|push|deploy|prototype|research|investigate|compare|update|write|plan|fix|launch)\b/i;

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['projectId', 'tags', 'todoTitles', 'completedSignals'],
  properties: {
    projectId: {
      type: 'string',
      maxLength: 80,
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
      maxItems: 6,
    },
    todoTitles: {
      type: 'array',
      items: {
        type: 'string',
      },
      maxItems: 8,
    },
    completedSignals: {
      type: 'array',
      items: {
        type: 'string',
      },
      maxItems: 8,
    },
  },
} as const;

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function expandCompoundTodoTitles(values: string[]) {
  return uniqueStrings(
    values.flatMap((value) => {
      const normalized = value.replace(/\s+/g, ' ').trim();
      if (!normalized) {
        return [];
      }

      const parts = normalized
        .split(/\s*(?:,|;|\band\b|\bthen\b|\balso\b)\s*/i)
        .map((part) => part.trim().replace(/^(?:maybe|just)\s+/i, '').replace(/^[,;:-]+\s*/, ''))
        .filter(Boolean);

      if (parts.length <= 1) {
        return [titleCase(normalized)];
      }

      const actionableParts = parts
        .filter((part) => actionStartPattern.test(part))
        .map((part) => titleCase(part));

      return actionableParts.length ? actionableParts : [titleCase(normalized)];
    }),
  );
}

function buildPrompt(input: OpenAiNoteAnalysisInput) {
  return [
    'You analyze a single Notey note and return only structured data.',
    `Choose the best project id for this note. If nothing is clearly better, keep ${input.fallbackProjectId || 'an empty string'}.`,
    'Project ids should be short, lowercase, and slug-like when you introduce a new one.',
    'If the note does not clearly belong to any project, return an empty string for projectId.',
    'Extract short useful tags, clear actionable to-dos, and statements that imply previously-open work is now complete.',
    'Treat recent project notes as context only. Use them to detect follow-up tasks or completion updates across notes.',
    'Keep todos concise and imperative. If one sentence contains multiple actions, split them into separate todoTitles.',
    'Example: "meeting with Ahmed and pushing to production" should become two todoTitles, not one combined item.',
    'Example: "buy some groceries tomorrow and do the laundry, maybe buy mom some meat" should become three todoTitles.',
    'Avoid duplicates, vague tags, and commentary.',
    `Fallback project id: ${input.fallbackProjectId}`,
    `Current note:\n${input.content}`,
    `Recent same-project notes from the last week:\n${input.recentProjectNotes.join('\n---\n') || 'none'}`,
  ].join('\n\n');
}

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const response = payload as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: unknown;
      }>;
    }>;
  };

  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (contentItem.type === 'output_text' && typeof contentItem.text === 'string' && contentItem.text.trim()) {
        return contentItem.text;
      }
    }
  }

  return '';
}

function sanitizeResult(input: {
  raw: {
    projectId?: unknown;
    tags?: unknown;
    todoTitles?: unknown;
    completedSignals?: unknown;
  };
  fallbackProjectId: string;
  prompt: string;
}): OpenAiNoteAnalysisResult {
  const suggestedProjectId =
    typeof input.raw.projectId === 'string'
      ? input.raw.projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
      : input.fallbackProjectId;

  const tags = Array.isArray(input.raw.tags)
    ? uniqueStrings(input.raw.tags.filter((value): value is string => typeof value === 'string')).slice(0, 5)
    : [];
  const todoTitles = Array.isArray(input.raw.todoTitles)
    ? expandCompoundTodoTitles(input.raw.todoTitles.filter((value): value is string => typeof value === 'string')).slice(0, 5)
    : [];
  const completedSignals = Array.isArray(input.raw.completedSignals)
    ? uniqueStrings(input.raw.completedSignals.filter((value): value is string => typeof value === 'string')).slice(0, 8)
    : [];

  return {
    suggestedProjectId,
    tags,
    todoTitles,
    completedSignals,
    prompt: input.prompt,
  };
}

export function hasOpenAiNoteAnalysisConfig() {
  return Boolean(env.OPENAI_API_KEY);
}

export async function analyzeNoteWithOpenAI(input: OpenAiNoteAnalysisInput) {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  const prompt = buildPrompt(input);
  const response = await fetch(`${env.OPENAI_BASE_URL}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: 'Return valid JSON matching the schema exactly. Do not include markdown or explanation.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'note_analysis',
          strict: true,
          schema: responseSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.warn(
      {
        status: response.status,
        body: errorBody,
      },
      'OpenAI note analysis request failed'
    );
    return null;
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractOutputText(payload);
  if (!outputText) {
    logger.warn('OpenAI note analysis returned no structured output text');
    return null;
  }

  try {
    const parsed = JSON.parse(outputText) as {
      projectId?: unknown;
      tags?: unknown;
      todoTitles?: unknown;
      completedSignals?: unknown;
    };

    return sanitizeResult({
      raw: parsed,
      fallbackProjectId: input.fallbackProjectId,
      prompt,
    });
  } catch (error) {
    logger.warn({ err: error, outputText }, 'Failed to parse OpenAI note analysis output');
    return null;
  }
}
