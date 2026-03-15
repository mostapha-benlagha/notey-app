import type { Types } from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { NoteModel } from '../models/note.model.js';
import { SettingsModel } from '../models/settings.model.js';
import { TaskModel } from '../models/task.model.js';
import { publishNoteAnalysisUpdate } from './realtime.service.js';
import { ensureTaskStatus, ensureTaskStatuses } from './task-status.service.js';

interface GeminiNoteAnalysisInput {
  content: string;
  fallbackProjectId: string;
  recentProjectNotes: string[];
}

interface GeminiTodoItem {
  title: string;
  details: string;
}

interface GeminiNoteAnalysisResult {
  suggestedProjectId: string;
  tags: string[];
  todoItems: GeminiTodoItem[];
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
const runningJobs = new Set<string>();
const MATCH_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'into',
  'about',
  'because',
  'before',
  'after',
  'while',
  'need',
  'still',
  'just',
  'have',
  'yesterday',
  'today',
  'tomorrow',
]);

const responseSchema = {
  type: 'object',
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

  return titleCase(words.slice(0, 8).join(' '));
}

function buildPrompt(input: GeminiNoteAnalysisInput) {
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

function extractTextFromGeminiResponse(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const response = payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: unknown;
        }>;
      };
    }>;
  };

  return response.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim() ?? '';
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

function buildTodoDedupKey(item: GeminiTodoItem) {
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

function isValidTodoItem(item: GeminiTodoItem) {
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

function dedupeTodoItems(items: GeminiTodoItem[]) {
  const deduped = new Map<string, GeminiTodoItem>();

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

function overlapScore(left: string, right: string) {
  const normalize = (value: string) =>
    normalizeTodoText(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !MATCH_STOP_WORDS.has(word));

  const leftWords = new Set(normalize(left));
  const rightWords = new Set(normalize(right));
  let score = 0;

  leftWords.forEach((word) => {
    if (rightWords.has(word)) {
      score += 1;
    }
  });

  return score;
}

function matchesTodo(taskTitle: string, todoTitle: string) {
  return overlapScore(taskTitle, todoTitle) >= 3;
}

function matchesCompletionSignal(taskTitle: string, completionSignals: string[]) {
  return completionSignals.some((signal) => overlapScore(taskTitle, signal) >= 2);
}

function buildAnalysisSummary(input: {
  projectChanged: boolean;
  projectId: string;
  tags: string[];
  createdTodoCount: number;
  completedTodoCount: number;
}) {
  const segments: string[] = [];

  if (input.projectChanged) {
    segments.push(`Moved to ${input.projectId}.`);
  }
  if (input.tags.length) {
    segments.push(`Tagged with ${input.tags.slice(0, 3).join(', ')}.`);
  }
  if (input.createdTodoCount > 0) {
    segments.push(`Created ${input.createdTodoCount} to-do${input.createdTodoCount === 1 ? '' : 's'}.`);
  }
  if (input.completedTodoCount > 0) {
    segments.push(`Marked ${input.completedTodoCount} to-do${input.completedTodoCount === 1 ? '' : 's'} done.`);
  }

  return segments.length ? segments.join(' ') : 'Analysis completed with no major changes.';
}

function expandStructuredTodoItem(item: GeminiTodoItem) {
  const actionableParts = splitActionableParts(item.details);
  if (actionableParts.length <= 1) {
    return [item];
  }

  return actionableParts.map((part) => ({
    title: buildCompactTodoTitle(part),
    details: normalizeTodoText(part),
  }));
}

function extractTodoItems(rawTodoItems: unknown) {
  const structuredItems = Array.isArray(rawTodoItems)
    ? rawTodoItems
        .flatMap((item) => {
          if (!item || typeof item !== 'object') {
            return [];
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
            return [];
          }

          const baseItem = {
            title: resolvedTitle,
            details: resolvedDetails,
          } satisfies GeminiTodoItem;

          return expandStructuredTodoItem(baseItem);
        })
    : [];

  return dedupeTodoItems(structuredItems).filter(isValidTodoItem).slice(0, 8);
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
    completedSignals?: unknown;
  };
  prompt: string;
  noteContent: string;
}): GeminiNoteAnalysisResult {
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
  const todoItems = extractTodoItems(input.raw.todoItems).filter(
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

export function hasGeminiNoteAnalysisConfig() {
  return Boolean(env.GEMINI_API_KEY);
}

export async function analyzeNoteWithGemini(input: GeminiNoteAnalysisInput) {
  if (!env.GEMINI_API_KEY) {
    logger.debug('Skipping Gemini note analysis because GEMINI_API_KEY is not configured');
    return null;
  }

  const prompt = buildPrompt(input);
  logger.info(
    {
      model: env.GEMINI_MODEL,
      baseUrl: env.GEMINI_BASE_URL,
      fallbackProjectId: input.fallbackProjectId || '',
      contentLength: input.content.length,
      recentNotesCount: input.recentProjectNotes.length,
    },
    'Gemini note analysis started'
  );

  const response = await fetch(`${env.GEMINI_BASE_URL}/models/${env.GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': env.GEMINI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: responseSchema,
      },
    }),
  });

  logger.info(
    {
      status: response.status,
      ok: response.ok,
      model: env.GEMINI_MODEL,
    },
    'Gemini note analysis response received'
  );

  if (!response.ok) {
    const errorBody = await response.text();
    logger.warn({ status: response.status, body: errorBody }, 'Gemini note analysis request failed');
    return null;
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractTextFromGeminiResponse(payload);
  if (!outputText) {
    logger.warn({ payload }, 'Gemini note analysis returned no text output');
    return null;
  }

  try {
    const parsed = JSON.parse(outputText) as {
      projectId?: unknown;
      tags?: unknown;
      todoItems?: unknown;
      completedSignals?: unknown;
    };
    const result = sanitizeResult({
      raw: parsed,
      prompt,
      noteContent: input.content,
    });
    logger.info(
      {
        provider: 'gemini',
        suggestedProjectId: result.suggestedProjectId,
        tagCount: result.tags.length,
        todoCount: result.todoItems.length,
        completedSignalCount: result.completedSignals.length,
      },
      'Gemini note analysis result accepted'
    );
    return result;
  } catch (error) {
    logger.warn({ err: error, outputText }, 'Failed to parse Gemini note analysis output');
    return null;
  }
}

async function processNoteAnalysis(noteId: string, userId: Types.ObjectId) {
  if (!hasGeminiNoteAnalysisConfig()) {
    return;
  }

  const settings = await SettingsModel.findOne({ userId }).lean();
  const note = await NoteModel.findOne({ _id: noteId, userId });
  if (!note) {
    return;
  }

  const recentContextNotes = await NoteModel.find({
    userId,
    projectId: note.projectId,
    _id: { $ne: note._id },
    createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
  })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

  const analysis = await analyzeNoteWithGemini({
    content: note.content,
    fallbackProjectId: note.projectId,
    recentProjectNotes: recentContextNotes.map((item) => item.content),
  });

  if (!analysis) {
    note.analysis = {
      status: 'failed',
      summary: 'Gemini analysis returned no usable result.',
      lastAnalyzedAt: new Date(),
    };
    await note.save();
    publishNoteAnalysisUpdate({
      userId: userId.toString(),
      note,
      tasks: [],
    });
    return;
  }

  logger.debug(
    {
      noteId,
      userId: userId.toString(),
      providerConfigured: hasGeminiNoteAnalysisConfig(),
      prompt: analysis.prompt,
      suggestedProjectId: analysis.suggestedProjectId,
      tags: analysis.tags,
      todoTitles: analysis.todoItems.map((item) => item.title),
      todoItems: analysis.todoItems,
      completedSignals: analysis.completedSignals,
    },
    'Background Gemini note analysis completed'
  );

  const previousProjectId = note.projectId;
  if (settings?.aiTaggingEnabled !== false) {
    note.tags = analysis.tags;
  }
  note.projectId = analysis.suggestedProjectId;
  let createdTodoCount = 0;
  let completedTodoCount = 0;
  const touchedTaskIds = new Set<string>();

  const statuses = await ensureTaskStatuses(userId);
  const todoStatusId = statuses.find((status) => status.id === 'todo')?.id ?? statuses[0]?.id ?? 'draft';
  await ensureTaskStatus(userId, 'done');

  const projectTasks = await TaskModel.find({
    userId,
    projectId: note.projectId,
    deletedAt: null,
  }).sort({ createdAt: -1 });

  if (settings?.taskExtractionEnabled !== false) {
    for (const todoItem of analysis.todoItems) {
      const taskTitle = compactWhitespace(todoItem.title) || buildCompactTodoTitle(todoItem.details);
      const taskDescription = compactWhitespace(todoItem.details) || normalizeTodoText(todoItem.title);
      const existingTask = projectTasks.find((task) => matchesTodo(`${task.title} ${task.description ?? ''}`.trim(), taskDescription));

      if (existingTask) {
        logger.info(
          {
            noteId,
            matchedTaskId: existingTask.id,
            matchedTaskTitle: existingTask.title,
            incomingTaskTitle: taskTitle,
            incomingTaskDescription: taskDescription,
          },
          'Reused existing Gemini AI task instead of creating a new one'
        );
        existingTask.evidenceNoteIds = uniqueStrings([...(existingTask.evidenceNoteIds ?? []), note.id]);
        if (!existingTask.noteId) {
          existingTask.noteId = note.id;
        }
        await existingTask.save();
        touchedTaskIds.add(existingTask.id);
        continue;
      }

      const order = await TaskModel.countDocuments({ userId, statusId: todoStatusId });
      const createdTask = await TaskModel.create({
        userId,
        title: taskTitle,
        description: taskDescription,
        statusId: todoStatusId,
        projectId: note.projectId,
        noteId: note.id,
        evidenceNoteIds: [note.id],
        source: 'note_ai',
        tags: analysis.tags,
        order,
      });
      logger.info(
        {
          noteId,
          createdTaskId: createdTask.id,
          createdTaskTitle: createdTask.title,
          createdTaskDescription: createdTask.description,
        },
        'Created new Gemini AI task from note analysis'
      );
      projectTasks.unshift(createdTask);
      touchedTaskIds.add(createdTask.id);
      createdTodoCount += 1;
    }
  }

  if (analysis.completedSignals.length) {
    const doneStatus = await ensureTaskStatus(userId, 'done');
    if (!doneStatus) {
      return;
    }

    for (const task of projectTasks) {
      if (task.statusId === doneStatus.id) {
        continue;
      }

      if (!matchesCompletionSignal(`${task.title} ${task.description ?? ''}`.trim(), analysis.completedSignals)) {
        continue;
      }

      task.statusId = doneStatus.id;
      task.projectId = note.projectId;
      task.evidenceNoteIds = uniqueStrings([...(task.evidenceNoteIds ?? []), note.id]);
      await task.save();
      touchedTaskIds.add(task.id);
      completedTodoCount += 1;
    }
  }

  note.analysis = {
    status: 'completed',
    summary: buildAnalysisSummary({
      projectChanged: previousProjectId !== note.projectId,
      projectId: note.projectId,
      tags: note.tags,
      createdTodoCount,
      completedTodoCount,
    }),
    lastAnalyzedAt: new Date(),
  };
  await note.save();

  const touchedTasks = touchedTaskIds.size
    ? await TaskModel.find({
        _id: { $in: Array.from(touchedTaskIds) },
        userId,
      })
    : [];

  publishNoteAnalysisUpdate({
    userId: userId.toString(),
    note,
    tasks: touchedTasks,
  });
}

export function queueNoteAnalysis(noteId: string, userId: Types.ObjectId) {
  if (!hasGeminiNoteAnalysisConfig()) {
    return;
  }

  const jobId = `${userId.toString()}:${noteId}`;
  if (runningJobs.has(jobId)) {
    return;
  }

  runningJobs.add(jobId);
  setTimeout(async () => {
    try {
      await processNoteAnalysis(noteId, userId);
    } catch (error) {
      const failedNote = await NoteModel.findOneAndUpdate(
        { _id: noteId, userId },
        {
          $set: {
            analysis: {
              status: 'failed',
              summary: 'Gemini analysis failed. You can keep working while we retry later.',
              lastAnalyzedAt: new Date(),
            },
          },
        },
        { new: true },
      );
      if (failedNote) {
        publishNoteAnalysisUpdate({
          userId: userId.toString(),
          note: failedNote,
          tasks: [],
        });
      }
      logger.error({ err: error, noteId, userId: userId.toString() }, 'Background Gemini note analysis failed');
    } finally {
      runningJobs.delete(jobId);
    }
  }, 0);
}
