import type { NoteDocument, NoteLean } from '../../models/note.model.js';

type SerializableNote = NoteDocument | NoteLean;

export function serializeNote(note: SerializableNote) {
  return {
    id: note._id.toString(),
    content: note.content,
    richContent: note.richContent,
    projectId: note.projectId,
    tags: note.tags,
    attachments: note.attachments,
    createdAt: note.createdAt.toISOString(),
  };
}
