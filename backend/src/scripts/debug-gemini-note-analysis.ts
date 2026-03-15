import { analyzeNoteWithGemini, hasGeminiNoteAnalysisConfig } from '../services/gemini-note-analysis.service.js';

const sampleNote =
  process.argv.slice(2).join(' ').trim() ||
  'I need to schedule a meeting with Karim, prepare the proposal document, send it to him, review the design files, assign technical tasks, call the supplier, compare the invoice, update the roadmap, push the code, and write a team update.';

async function main() {
  console.log('Gemini configured:', hasGeminiNoteAnalysisConfig());
  console.log('Sample note:', sampleNote);

  const result = await analyzeNoteWithGemini({
    content: sampleNote,
    fallbackProjectId: 'work',
    recentProjectNotes: [
      'We need to finalize the proposal draft and compare supplier quotes this week.',
      'Karim asked for a roadmap update before the next client review.',
    ],
  });

  console.log('Gemini result:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error('Gemini debug script failed');
  console.error(error);
  process.exit(1);
});
