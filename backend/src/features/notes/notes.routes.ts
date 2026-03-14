import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/require-auth.js';
import { createNote, deleteNote, getNote, listNotes, streamAttachment, updateNote, uploadAttachments } from './notes.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 8,
  },
});

export const notesRouter = Router();

notesRouter.use(requireAuth);

notesRouter.get('/', listNotes);
notesRouter.post('/attachments/upload', upload.array('files'), uploadAttachments);
notesRouter.get('/attachments/:objectKey', streamAttachment);
notesRouter.get('/:noteId', getNote);
notesRouter.post('/', createNote);
notesRouter.patch('/:noteId', updateNote);
notesRouter.delete('/:noteId', deleteNote);
