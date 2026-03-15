import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

interface OpenAiNoteAnalysisInput {
  content: string;
  fallbackProjectId: string;
  recentProjectNotes: string[];
}

interface OpenAiTodoItem {
  title: string;
  details: string;
}

interface OpenAiNoteAnalysisResult {
  suggestedProjectId: string;
  tags: string[];
  todoItems: OpenAiTodoItem[];
  completedSignals: string[];
  prompt: string;
}

const actionStartPattern =
  /^(meet(?:ing)?|call|sync|buy|do|prepare|send|review|follow up|ship|draft|schedule|finalize|create|push|deploy|prototype|research|investigate|compare|update|write|plan|fix|launch|check|confirm|reply|email|message|ask|discuss|test|verify|clean|organize|refactor|remove|add|implement|validate|contact|submit|renew|book|pay|collect|pick up|get|extract|assign|set)\b/i;
const narrativeTitlePattern =
  /^(had|yesterday|today|in the morning|later in the afternoon|finally|random thought|nothing much|um|well|so)\b/i;
const weakCompletedSignals = new Set(['done', 'finished', 'completed', 'sent it', 'did it']);
const weakTodoTitles = new Set(['review', 'meeting', 'work update', 'follow up', 'todo', 'task', 'action item', 'item']);
const genericProjectIds = new Set(['none', 'null', 'misc', 'general', 'other']);
const weakTags = new Set(['meeting', 'product', 'operations', 'review', 'insight', 'priority', 'general', 'work', 'personal', 'note', 'task', 'update', 'misc']);
const technicalProjectIds = new Set(['deployment', 'infrastructure', 'backend', 'frontend', 'devops', 'engineering', 'notey']);
const personalProjectIds = new Set(['personal', 'home', 'family', 'errands']);

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['projectId', 'tags', 'todoItems', 'completedSignals'],
  properties: {
    projectId: {
      type: 'string',
      maxLength: 80,
      description: 'Existing project id, a new short lowercase slug-like and specific project id, or an empty string.',
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
      },
      maxItems: 6,
      description: 'Concrete, domain-specific tags for the note.',
    },
    todoItems: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'details'],
        properties: {
          title: {
            type: 'string',
            maxLength: 80,
            description: 'A concise imperative task title for exactly one action.',
          },
          details: {
            type: 'string',
            maxLength: 280,
            description: 'The fuller actionable phrase for exactly one action.',
          },
        },
      },
      maxItems: 12,
      description: 'Atomic actionable tasks extracted from the note.',
    },
    completedSignals: {
      type: 'array',
      items: {
        type: 'string',
      },
      maxItems: 8,
      description: 'Concrete statements that clearly indicate completed work.',
    },
  },
} as const;

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function normalizeTodoText(value: string) {
  return compactWhitespace(value)
    .replace(/^(?:i need to|need to|i should|should|please|maybe|just|still need to)\s+/i, '')
    .replace(/^[,;:-]+\s*/, '')
    .replace(/[.;:,]+$/g, '');
}

function normalizeNarrativePrefix(value: string) {
  return compactWhitespace(value)
    .replace(/^(?:in the morning|later in the afternoon|today|yesterday|finally)\s+/i, '')
    .replace(/^(?:i plan to|i need to|i should|we need to|we should)\s+/i, '')
    .trim();
}

function isGenericProjectId(value: string) {
  return genericProjectIds.has(value.trim().toLowerCase());
}

function isWeakCompletedSignal(value: string) {
  return weakCompletedSignals.has(value.trim().toLowerCase());
}

function looksLikeActionPhrase(value: string) {
  const normalized = normalizeNarrativePrefix(normalizeTodoText(value));
  return actionStartPattern.test(normalized);
}

function splitOnActionableAnd(value: string) {
  const parts = value.split(/\s+\band\b\s+/i).map((part) => compactWhitespace(part)).filter(Boolean);
  if (parts.length <= 1) {
    return [value];
  }

  return parts.every((part) => looksLikeActionPhrase(part)) ? parts : [value];
}

function splitActionableParts(value: string): string[] {
  const strongParts = value
    .split(/\s*(?:,|;|\bthen\b|\balso\b)\s*/i)
    .map((part) => compactWhitespace(part))
    .filter(Boolean);

  const combinedParts = (strongParts.length ? strongParts : [value]).flatMap((part) => splitOnActionableAnd(part));
  const normalizedParts = combinedParts.map((part) => normalizeTodoText(part)).filter(Boolean);
  const actionableParts = normalizedParts.filter((part) => looksLikeActionPhrase(part));

  if (!actionableParts.length) {
    return normalizedParts.length ? [normalizedParts[0]] : [];
  }

  return actionableParts;
}

function buildCompactTodoTitle(value: string) {
  const normalized = normalizeNarrativePrefix(normalizeTodoText(value));
  if (!normalized) {
    return '';
  }

  const words = normalized.split(' ').filter(Boolean);
  if (words.length <= 8) {
    return titleCase(normalized);
  }

  const shortened = words.slice(0, 8).join(' ');
  return titleCase(shortened);
}

function buildPrompt(input: OpenAiNoteAnalysisInput) {
  return [
    'You analyze one Notey note and return structured JSON for downstream automation.',
    'The current note is the primary source of truth. Use recent notes only as secondary context.',
    '',
    'CRITICAL RULES:',
    '- Extract EVERY independent actionable task mentioned in the note.',
    '- Never merge multiple actions into one todo item.',
    '- Prefer many small precise tasks over one summarized task.',
    '- Each todo item must represent exactly ONE action.',
    '- If the note contains 5 actions, return 5 todo items.',
    '- Do not summarize paragraphs into a single task.',
    '- Do not use the first sentence of a paragraph as a task title unless it is itself an action.',
    '',
    'EXCLUSION RULES:',
    '- Do not extract descriptive context as a todo.',
    '- Do not extract meeting context alone as a todo unless there is an action such as schedule, prepare, send, review, or follow up.',
    '- Do not extract vague thoughts, future possibilities, brainstorming, or non-urgent ideas as todos.',
    '- Do not extract completed work as a todo.',
    '- If text is informational only, return no todo item for it.',
    '',
    'TAG RULES:',
    '- Tags must be concrete and domain-specific.',
    '- Do not return generic tags such as meeting, product, operations, review, insight, priority, note, task, update, or general.',
    '- Prefer tags like docker, nginx, deployment, redis, supplier, invoice, roadmap, repository, proposal, hardware.',
    '- If no strong tags exist, return fewer tags instead of generic tags.',
    '',
    'PROJECT RULES:',
    '- Prefer a project explicitly indicated by the current note.',
    '- Otherwise use recent notes only as supporting context.',
    `- Reuse "${input.fallbackProjectId || ''}" only if the current note plausibly continues that same project.`,
    '- If the note does not clearly belong to a project, return an empty string.',
    '- Do not assign clearly technical deployment notes to personal.',
    '- Do not invent a project unless the note strongly suggests one.',
    '',
    'COMPLETION RULES:',
    '- Add a completed signal only when completion is directly stated or strongly implied.',
    '- Good examples: api refactor completed, changes pushed to production, invoice sent.',
    '- Bad examples: done, finished, sent it, did it.',
    '- Completed work must not also appear as an open todo.',
    '',
    'QUALITY RULES:',
    '- Extract only explicit or strongly implied actions.',
    '- Do not extract reflections, observations, or vague ideas as todos.',
    '- Do not include completed work as todos.',
    '- Add completedSignals only when completion is directly stated or strongly implied.',
    '- Prefer fewer, higher-confidence items over noisy extraction.',
    '',
    'Examples:',
    'Input: "I need to schedule a meeting with Karim, prepare the proposal document, send it to him, review the design files, assign technical tasks, call the supplier, compare the invoice, update the roadmap, push the code, and write a team update."',
    'Expected todoItems:',
    '[',
    '  { "title": "Schedule meeting with Karim", "details": "schedule a meeting with Karim" },',
    '  { "title": "Prepare proposal document", "details": "prepare the proposal document" },',
    '  { "title": "Send proposal document", "details": "send the proposal document to Karim" },',
    '  { "title": "Review design files", "details": "review the design files" },',
    '  { "title": "Assign technical tasks", "details": "assign the technical tasks" },',
    '  { "title": "Call supplier", "details": "call the supplier" },',
    '  { "title": "Compare invoice with quote", "details": "compare the invoice with the quote" },',
    '  { "title": "Update project roadmap", "details": "update the project roadmap" },',
    '  { "title": "Push code changes", "details": "push the code changes" },',
    '  { "title": "Write team update", "details": "write a team update" }',
    ']',
    'Input: "Had a long sync with Ahmed today about deployment"',
    'Expected todoItems: []',
    'Input: "meet Ahmed and Samir tomorrow"',
    'Expected todoItems: [{ "title": "Meet Ahmed and Samir tomorrow", "details": "meet Ahmed and Samir tomorrow" }]',
    '',
    `Fallback project id: ${input.fallbackProjectId || '(none)'}`,
    `Current note:\n${input.content}`,
    `Recent same-project notes from the last week:\n${input.recentProjectNotes.join('\n---\n') || 'none'}`,
  ].join('\n');
}

function extractParsedOutput(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const response = payload as {
    output_parsed?: unknown;
    output?: Array<{
      content?: Array<{
        parsed?: unknown;
      }>;
    }>;
  };

  if (response.output_parsed && typeof response.output_parsed === 'object') {
    return response.output_parsed;
  }

  for (const item of response.output ?? []) {
    for (const contentItem of item.content ?? []) {
      if (contentItem.parsed && typeof contentItem.parsed === 'object') {
        return contentItem.parsed;
      }
    }
  }

  return null;
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

function normalizeProjectId(rawProjectId: unknown) {
  if (typeof rawProjectId !== 'string') {
    return '';
  }

  const sanitized = compactWhitespace(rawProjectId)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  if (!sanitized || isGenericProjectId(sanitized)) {
    return '';
  }

  return sanitized;
}

function noteLooksTechnical(content: string) {
  return /\b(docker|nginx|redis|deploy|deployment|production|server|container|repository|repo|build|api|backend|frontend|infrastructure|hosting)\b/i.test(content);
}

function noteLooksPersonal(content: string) {
  return /\b(groceries|laundry|mom|dad|family|home|rent|household|pay bills|pick up|meat|weekend)\b/i.test(content);
}

function postValidateProjectId(projectId: string, noteContent: string) {
  if (!projectId) {
    return '';
  }

  if (noteLooksTechnical(noteContent) && personalProjectIds.has(projectId)) {
    return '';
  }

  if (noteLooksPersonal(noteContent) && technicalProjectIds.has(projectId)) {
    return '';
  }

  return projectId;
}

function normalizeTag(value: string) {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCompletedSignal(value: string) {
  const normalized = compactWhitespace(value)
    .toLowerCase()
    .replace(/^(?:it was|this was|that was|we|i)\s+/i, '')
    .replace(/[.;:,]+$/g, '');

  if (!normalized || isWeakCompletedSignal(normalized)) {
    return '';
  }

  return /\b[a-z]{3,}\b.*\b(completed|finished|sent|pushed|shipped|deployed|closed|resolved)\b|\b(completed|finished|sent|pushed|shipped|deployed|closed|resolved)\b.*\b[a-z]{3,}\b/i.test(normalized)
    ? normalized
    : '';
}

function isWeakTodoTitle(value: string) {
  const normalized = value.trim().toLowerCase();
  return !normalized || weakTodoTitles.has(normalized) || narrativeTitlePattern.test(normalized);
}

function buildTodoDedupKey(item: OpenAiTodoItem) {
  return `${normalizeTodoText(item.title).toLowerCase()}::${normalizeTodoText(item.details).toLowerCase()}`;
}

function detailsContainAction(details: string) {
  return splitActionableParts(details).some((part) => looksLikeActionPhrase(part));
}

function isTooSimilarToDetails(title: string, details: string) {
  const normalizedTitle = normalizeTodoText(title).toLowerCase();
  const normalizedDetails = normalizeTodoText(details).toLowerCase();
  return normalizedDetails.startsWith(normalizedTitle) && normalizedDetails.length - normalizedTitle.length > 40 && narrativeTitlePattern.test(normalizedTitle);
}

function isValidTodoItem(item: OpenAiTodoItem) {
  const title = compactWhitespace(item.title);
  const details = compactWhitespace(item.details);

  if (!title || !details) {
    return false;
  }

  if (isWeakTodoTitle(title)) {
    return false;
  }

  const normalizedTitle = normalizeNarrativePrefix(normalizeTodoText(title));
  if (!actionStartPattern.test(normalizedTitle)) {
    return false;
  }

  if (isTooSimilarToDetails(title, details)) {
    return false;
  }

  if (!detailsContainAction(details)) {
    return false;
  }

  return true;
}

function dedupeTodoItems(items: OpenAiTodoItem[]) {
  const deduped = new Map<string, OpenAiTodoItem>();

  items.forEach((item) => {
    const cleaned = {
      title: compactWhitespace(item.title),
      details: compactWhitespace(item.details),
    };
    const key = buildTodoDedupKey(cleaned);

    if (!key || deduped.has(key)) {
      return;
    }

    deduped.set(key, cleaned);
  });

  return Array.from(deduped.values());
}

function extractTodoItems(rawTodoItems: unknown, legacyTodoTitles: unknown) {
  const structuredItems = Array.isArray(rawTodoItems)
    ? rawTodoItems
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const todo = item as { title?: unknown; details?: unknown };
          const rawTitle = typeof todo.title === 'string' ? compactWhitespace(todo.title) : '';
          const rawDetails = typeof todo.details === 'string' ? normalizeTodoText(todo.details) : '';
          const resolvedDetails = rawDetails || normalizeTodoText(rawTitle);
          const resolvedTitle =
            rawTitle && !isWeakTodoTitle(rawTitle) && looksLikeActionPhrase(rawTitle)
              ? titleCase(rawTitle.replace(/[.;:,]+$/g, ''))
              : buildCompactTodoTitle(resolvedDetails);

          if (!resolvedTitle || !resolvedDetails) {
            return null;
          }

          return {
            title: resolvedTitle,
            details: resolvedDetails,
          } satisfies OpenAiTodoItem;
        })
        .filter((item): item is OpenAiTodoItem => Boolean(item))
    : [];

  if (structuredItems.length) {
    return dedupeTodoItems(structuredItems).filter(isValidTodoItem).slice(0, 8);
  }

  const fallbackTitles = Array.isArray(legacyTodoTitles)
    ? legacyTodoTitles.filter((value): value is string => typeof value === 'string')
    : [];

  const fallbackItems = fallbackTitles.flatMap((value) =>
    splitActionableParts(value).map((part) => ({
      title: buildCompactTodoTitle(part),
      details: normalizeTodoText(part),
    })),
  );

  return dedupeTodoItems(fallbackItems).filter(isValidTodoItem).slice(0, 8);
}

function isLikelyInformationalOnly(content: string) {
  const normalized = compactWhitespace(content);
  if (!normalized) {
    return true;
  }

  const hasAction = actionStartPattern.test(normalized) || /\bneed to|should|must|todo|to-do|follow up\b/i.test(normalized);
  const hasCompletion = /\b(completed|finished|sent|pushed|deployed|shipped|resolved|closed)\b/i.test(normalized);
  const looksReference = /\b(wikipedia|introduced by|in their work|algorithm|lorem ipsum|history of|is a program|is a system)\b/i.test(normalized);

  return looksReference && !hasAction && !hasCompletion;
}

function sanitizeResult(input: {
  raw: {
    projectId?: unknown;
    tags?: unknown;
    todoItems?: unknown;
    todoTitles?: unknown;
    completedSignals?: unknown;
  };
  fallbackProjectId: string;
  prompt: string;
  noteContent: string;
}): OpenAiNoteAnalysisResult {
  if (isLikelyInformationalOnly(input.noteContent)) {
    return {
      suggestedProjectId: '',
      tags: [],
      todoItems: [],
      completedSignals: [],
      prompt: input.prompt,
    };
  }

  const suggestedProjectId = postValidateProjectId(normalizeProjectId(input.raw.projectId), input.noteContent);
  const tags = Array.isArray(input.raw.tags)
    ? uniqueStrings(
        input.raw.tags
          .filter((value): value is string => typeof value === 'string')
          .map(normalizeTag)
          .filter((value) => value && !weakTags.has(value)),
      ).slice(0, 5)
    : [];
  const completedSignals = Array.isArray(input.raw.completedSignals)
    ? uniqueStrings(
        input.raw.completedSignals
          .filter((value): value is string => typeof value === 'string')
          .map(normalizeCompletedSignal)
          .filter(Boolean),
      ).slice(0, 8)
    : [];
  const completedSet = new Set(completedSignals.map((value) => normalizeTodoText(value).toLowerCase()));
  const todoItems = extractTodoItems(input.raw.todoItems, input.raw.todoTitles).filter(
    (item) => !completedSet.has(normalizeTodoText(item.details).toLowerCase()) && !completedSet.has(normalizeTodoText(item.title).toLowerCase()),
  );

  return {
    suggestedProjectId,
    tags,
    todoItems,
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
      instructions: 'Return valid JSON matching the schema exactly. Do not include markdown, prose, or extra fields.',
      input: prompt,
      store: false,
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
  const parsedOutput = extractParsedOutput(payload);
  if (parsedOutput) {
    return sanitizeResult({
      raw: parsedOutput as {
        projectId?: unknown;
        tags?: unknown;
        todoItems?: unknown;
        todoTitles?: unknown;
        completedSignals?: unknown;
      },
      fallbackProjectId: input.fallbackProjectId,
      prompt,
      noteContent: input.content,
    });
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    logger.warn('OpenAI note analysis returned no structured output text');
    return null;
  }

  try {
    const parsed = JSON.parse(outputText) as {
      projectId?: unknown;
      tags?: unknown;
      todoItems?: unknown;
      todoTitles?: unknown;
      completedSignals?: unknown;
    };

    return sanitizeResult({
      raw: parsed,
      fallbackProjectId: input.fallbackProjectId,
      prompt,
      noteContent: input.content,
    });
  } catch (error) {
    logger.warn({ err: error, outputText }, 'Failed to parse OpenAI note analysis output');
    return null;
  }
}
