import type { Types } from 'mongoose';
import { logger } from '../config/logger.js';
import { NoteModel } from '../models/note.model.js';
import { SettingsModel } from '../models/settings.model.js';
import { TaskModel } from '../models/task.model.js';
import { analyzeNoteWithOpenAI, hasOpenAiNoteAnalysisConfig } from './openai-note-analysis.service.js';
import { publishNoteAnalysisUpdate } from './realtime.service.js';
import { ensureTaskStatus, ensureTaskStatuses } from './task-status.service.js';

type ProjectCandidate = 'work' | 'startup' | 'research' | 'personal';

interface NoteAnalysisResult {
  suggestedProjectId: string;
  tags: string[];
  todoTitles: string[];
  completedSignals: string[];
  prompt: string;
}

const ACTION_PATTERNS = /\b(meet|meeting|call|sync|buy|do|prepare|send|review|follow up|ship|draft|schedule|finalize|create|push|deploy|prototype|research|investigate|compare|update|write|plan|fix|launch)\b/i;
const COMPLETION_PATTERNS = /\b(done|completed|finished|shipped|sent|closed|resolved|deployed|launched)\b/i;
const ACTION_START_PATTERN = /^(meet|meeting|call|sync|buy|do|prepare|send|review|follow up|ship|draft|schedule|finalize|create|push|deploy|prototype|research|investigate|compare|update|write|plan|fix|launch)\b/i;

const projectKeywords: Record<ProjectCandidate, string[]> = {
  work: ['meeting', 'ops', 'client', 'team', 'production', 'security', 'agenda', 'deliverable'],
  startup: ['beta', 'launch', 'activation', 'advisor', 'pricing', 'product', 'growth', 'roadmap'],
  research: ['research', 'crdt', 'paper', 'benchmark', 'compare', 'explore', 'hypothesis', 'local-first'],
  personal: ['home', 'family', 'health', 'trip', 'groceries', 'journal', 'weekend'],
};

const tagKeywords: Record<string, string[]> = {
  meeting: ['meeting', 'agenda', 'sync'],
  security: ['security', 'audit', 'incident', 'risk'],
  task: ['todo', 'task', 'follow up', 'prepare', 'send', 'update', 'ship'],
  research: ['research', 'investigate', 'prototype', 'compare'],
  product: ['product', 'launch', 'feature', 'release', 'activation'],
  operations: ['ops', 'production', 'deploy', 'runbook'],
};

const runningJobs = new Set<string>();

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function splitSentences(content: string) {
  return content
    .split(/[.!?\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function buildAiTaskTitle(todoText: string) {
  const normalized = compactWhitespace(todoText)
    .replace(/^(?:i need to|need to|please|maybe|just)\s+/i, '')
    .replace(/[.;:,]+$/g, '');

  const firstClause = normalized.split(/\s*(?:,|;| because | so that | while | after | before )\s*/i)[0]?.trim() ?? normalized;
  const words = firstClause.split(' ').filter(Boolean);
  const shortened = words.length > 7 ? `${words.slice(0, 7).join(' ')}...` : firstClause;

  return titleCase(shortened || normalized || todoText);
}

function buildAiTaskDescription(todoText: string) {
  return compactWhitespace(todoText);
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
        return [normalized];
      }

      const actionableParts = parts
        .filter((part) => ACTION_START_PATTERN.test(part))
        .map((part) => titleCase(part));

      return actionableParts.length ? actionableParts : [titleCase(normalized)];
    }),
  );
}

function buildNoteAnalysisPrompt(input: {
  noteContent: string;
  suggestedProjectId: string;
  recentProjectNotes: string[];
}) {
  return [
    'You analyze Notey notes and return structured JSON.',
    'Goals: extract actionable todos, relevant tags, the best project, and note any statements that imply existing work is complete.',
    `Current note: ${input.noteContent}`,
    `Current project guess: ${input.suggestedProjectId}`,
    `Recent same-project notes: ${input.recentProjectNotes.join(' || ') || 'none'}`,
    'Return fields: projectId, tags, todoTitles, completedSignals.',
  ].join('\n');
}

function inferProjectId(content: string, fallbackProjectId: string) {
  const normalized = normalizeText(content);
  let winner: { projectId: string; score: number } = { projectId: fallbackProjectId, score: 0 };

  for (const [projectId, keywords] of Object.entries(projectKeywords)) {
    const score = keywords.reduce((count, keyword) => (normalized.includes(keyword) ? count + 1 : count), 0);
    if (score > winner.score) {
      winner = { projectId, score };
    }
  }

  return winner.projectId;
}

function inferTags(content: string) {
  const normalized = normalizeText(content);
  const tags = Object.entries(tagKeywords)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([tag]) => tag);

  return uniqueStrings(tags.length ? tags : ['review', 'insight']).slice(0, 5);
}

function extractTodoTitles(content: string) {
  return expandCompoundTodoTitles(
    splitSentences(content)
      .filter((sentence) => ACTION_PATTERNS.test(sentence) && !COMPLETION_PATTERNS.test(sentence))
      .map((sentence) => titleCase(sentence)),
  ).slice(0, 5);
}

function extractCompletionSignals(content: string) {
  return uniqueStrings(
    splitSentences(content)
      .filter((sentence) => COMPLETION_PATTERNS.test(sentence))
      .map((sentence) => normalizeText(sentence)),
  );
}

function overlapScore(left: string, right: string) {
  const leftWords = new Set(normalizeText(left).split(' ').filter((word) => word.length > 2));
  const rightWords = new Set(normalizeText(right).split(' ').filter((word) => word.length > 2));
  let score = 0;

  leftWords.forEach((word) => {
    if (rightWords.has(word)) {
      score += 1;
    }
  });

  return score;
}

function matchesCompletionSignal(taskTitle: string, completionSignals: string[]) {
  return completionSignals.some((signal) => overlapScore(taskTitle, signal) >= 2);
}

function matchesTodo(taskTitle: string, todoTitle: string) {
  return overlapScore(taskTitle, todoTitle) >= 3;
}

async function analyzeNoteHeuristically(input: {
  content: string;
  fallbackProjectId: string;
  recentProjectNotes: string[];
}) {
  const suggestedProjectId = inferProjectId(input.content, input.fallbackProjectId);
  const tags = inferTags(input.content);
  const todoTitles = extractTodoTitles(input.content);
  const completedSignals = extractCompletionSignals(input.content);

  return {
    suggestedProjectId,
    tags,
    todoTitles,
    completedSignals,
    prompt: buildNoteAnalysisPrompt({
      noteContent: input.content,
      suggestedProjectId,
      recentProjectNotes: input.recentProjectNotes,
    }),
  } satisfies NoteAnalysisResult;
}

async function analyzeNote(input: {
  content: string;
  fallbackProjectId: string;
  recentProjectNotes: string[];
}) {
  const openAiResult = await analyzeNoteWithOpenAI(input);
  if (openAiResult) {
    return openAiResult;
  }

  if (hasOpenAiNoteAnalysisConfig()) {
    logger.warn('Falling back to heuristic note analysis after OpenAI returned no usable result');
  }

  return analyzeNoteHeuristically(input);
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
    segments.push(`Tagged with ${input.tags.slice(0, 3).join(", ")}.`);
  }
  if (input.createdTodoCount > 0) {
    segments.push(`Created ${input.createdTodoCount} to-do${input.createdTodoCount === 1 ? "" : "s"}.`);
  }
  if (input.completedTodoCount > 0) {
    segments.push(`Marked ${input.completedTodoCount} to-do${input.completedTodoCount === 1 ? "" : "s"} done.`);
  }

  return segments.length ? segments.join(" ") : "Analysis completed with no major changes.";
}

async function processNoteAnalysis(noteId: string, userId: Types.ObjectId) {
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

  const analysis = await analyzeNote({
    content: note.content,
    fallbackProjectId: note.projectId,
    recentProjectNotes: recentContextNotes.map((item) => item.content),
  });

  logger.debug(
    {
      noteId,
      userId: userId.toString(),
      provider: hasOpenAiNoteAnalysisConfig() ? 'openai-or-fallback' : 'heuristic',
      prompt: analysis.prompt,
      suggestedProjectId: analysis.suggestedProjectId,
      tags: analysis.tags,
      todoTitles: analysis.todoTitles,
      completedSignals: analysis.completedSignals,
    },
    'Background note analysis completed'
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
    for (const todoTitle of analysis.todoTitles) {
      const taskTitle = buildAiTaskTitle(todoTitle);
      const taskDescription = buildAiTaskDescription(todoTitle);
      const existingTask = projectTasks.find((task) => matchesTodo(`${task.title} ${task.description ?? ''}`.trim(), todoTitle));
      if (existingTask) {
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
              summary: 'Analysis failed. You can keep working while we retry later.',
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
      logger.error({ err: error, noteId, userId: userId.toString() }, 'Background note analysis failed');
    } finally {
      runningJobs.delete(jobId);
    }
  }, 0);
}
