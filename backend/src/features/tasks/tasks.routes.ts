import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createExtractedTasks,
  createTask,
  deleteTask,
  emptyTrash,
  listTasks,
  saveTaskStatuses,
  updateTask,
} from './tasks.controller.js';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);
tasksRouter.get('/', asyncHandler(listTasks));
tasksRouter.post('/', asyncHandler(createTask));
tasksRouter.post('/extracted', asyncHandler(createExtractedTasks));
tasksRouter.put('/statuses', asyncHandler(saveTaskStatuses));
tasksRouter.delete('/trash', asyncHandler(emptyTrash));
tasksRouter.patch('/:taskId', asyncHandler(updateTask));
tasksRouter.delete('/:taskId', asyncHandler(deleteTask));
