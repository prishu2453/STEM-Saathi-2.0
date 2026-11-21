import type { RichChapterData } from '../../shared/syllabus/types';
import { resolveLocalizedList, resolveLocalizedText } from '../data/curriculumCatalogue';
import type { Language } from '../types/stem';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const L: Record<string, Record<Language, string>> = {
  summary: { en: 'Summary', hi: 'सारांश', kn: 'ಸಾರಾಂಶ' },
  concepts: { en: 'Key concepts', hi: 'मुख्य बिंदु', kn: 'ಮುಖ್ಯ ಅಂಶಗಳು' },
  defs: { en: 'Definitions', hi: 'परिभाषाएँ', kn: 'ವ್ಯಾಖ್ಯಾನಗಳು' },
  formulas: { en: 'Formulas', hi: 'सूत्र', kn: 'ಸೂತ್ರಗಳು' },
  solved: { en: 'Solved problem', hi: 'हल किया गया प्रश्न', kn: 'ಬಿಡಿಸಿದ ಲೆಕ್ಕ' },
  revision: { en: 'Quick revision', hi: 'त्वरित दोहराव', kn: 'ತ್ವರಿತ ಪುನರಾವರ್ತನೆ' },
  uses: { en: 'Real-life uses', hi: 'दैनिक जीवन में उपयोग', kn: 'ದೈನಂದಿನ ಜೀವನದ ಉಪಯೋಗ' },
  qa: { en: 'Questions and answers', hi: 'प्रश्न और उत्तर', kn: 'ಪ್ರಶ್ನೆ ಮತ್ತು ಉತ್ತರ' },
  quiz: { en: 'Quick quiz (answers in bold)', hi: 'त्वरित प्रश्न (उत्तर मोटे अक्षरों में)', kn: 'ತ್ವರಿತ ಪ್ರಶ್ನೆ (ಉತ್ತರ ದಪ್ಪ ಅಕ್ಷರದಲ್ಲಿ)' },
  activity: { en: 'Experiment / activity', hi: 'प्रयोग / गतिविधि', kn: 'ಪ್ರಯೋಗ / ಚಟುವಟಿಕೆ' },
  materials: { en: 'You need', hi: 'सामग्री', kn: 'ಬೇಕಾದ ವಸ್ತುಗಳು' },
  steps: { en: 'Steps', hi: 'चरण', kn: 'ಹಂತಗಳು' },
  safety: { en: 'Safety', hi: 'सावधानी', kn: 'ಸುರಕ್ಷತೆ' },
  syllabus: { en: 'Syllabus', hi: 'पाठ्यक्रम', kn: 'ಪಠ್ಯಕ್ರಮ' },
  note: {
    en: 'Offline study pack from Gyaan Graph. Check the chapter list against your own textbook and teacher.',
    hi: 'STEM साथी का ऑफ़लाइन अध्ययन पैक। अध्यायों की सूची अपनी पाठ्यपुस्तक और शिक्षक से मिला लें।',
    kn: 'STEM ಸಾಥಿಯ ಆಫ್‌ಲೈನ್ ಅಧ್ಯಯನ ಪ್ಯಾಕ್. ಅಧ್ಯಾಯಗಳ ಪಟ್ಟಿಯನ್ನು ನಿಮ್ಮ ಪಠ್ಯಪುಸ್ತಕ ಮತ್ತು ಶಿಕ್ಷಕರೊಂದಿಗೆ ಹೋಲಿಸಿ.',
  },
};

/** One self-contained HTML file: works with no internet, prints cleanly, and can be shared by chat. */
export function buildStudyPackHtml(chapters: RichChapterData[], language: Language, syllabusLabel: string): string {
  const t = (k: string) => L[k][language];
  const list = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

  const body = chapters
    .map((ch) => {
      const title = resolveLocalizedText(ch.title, language).text;
      const defs = ch.definitions
        .map((d) => `<li><b>${esc(resolveLocalizedText(d.term, language).text)}</b> — ${esc(resolveLocalizedText(d.definition, language).text)}</li>`)
        .join('');
      const forms = ch.formulas
        .map(
          (f) =>
            `<li><b>${esc(resolveLocalizedText(f.name, language).text)}</b>: <code>${esc(f.formula)}</code><br><small>${esc(resolveLocalizedText(f.variables, language).text)}${f.unit && f.unit !== '—' ? ' · ' + esc(f.unit) : ''}</small></li>`
        )
        .join('');
      const solved = ch.solvedNumericals
        .map(
          (n) =>
            `<p><b>${esc(resolveLocalizedText(n.problem, language).text)}</b></p>${list(n.given)}<p><code>${esc(n.formulaUsed)}</code></p>${list(n.solutionSteps)}<p><b>${esc(n.finalAnswer)}</b></p>`
        )
        .join('');
      const qa = ch.chapterQuestions
        .map((q) => `<li><b>${esc(resolveLocalizedText(q.question, language).text)}</b><br>${esc(resolveLocalizedText(q.answer, language).text)}</li>`)
        .join('');
      const quiz = ch.mcqs
        .map((m) => {
          const opts = resolveLocalizedList(m.options, language).items;
          return `<li>${esc(resolveLocalizedText(m.question, language).text)}<ol type="A">${opts
            .map((o, i) => `<li>${i === m.correctIndex ? `<b>${esc(o)}</b>` : esc(o)}</li>`)
            .join('')}</ol><small>${esc(resolveLocalizedText(m.explanation, language).text)}</small></li>`;
        })
        .join('');
      const acts = ch.experiments
        .map((e) => {
          const steps = resolveLocalizedList(e.steps, language).items;
          const mats = resolveLocalizedList(e.materials, language).items;
          return `<h4>${esc(resolveLocalizedText(e.title, language).text)}</h4><p>${esc(resolveLocalizedText(e.objective, language).text)}</p><p><b>${t('materials')}:</b> ${esc(mats.join(', '))}</p><p><b>${t('steps')}:</b></p><ol>${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol><p><b>${t('safety')}:</b> ${esc(resolveLocalizedText(e.safetyNote, language).text)}</p>`;
        })
        .join('');
      return `<section><h2>${ch.chapterNumber}. ${esc(title)}</h2>
<p class="tag">${esc(ch.textbookName)}</p>
<h3>${t('summary')}</h3><p>${esc(resolveLocalizedText(ch.conceptSummary, language).text)}</p>
<h3>${t('concepts')}</h3>${list(resolveLocalizedList(ch.keyConcepts, language).items)}
<h3>${t('defs')}</h3><ul>${defs}</ul>
<h3>${t('formulas')}</h3><ul>${forms}</ul>
<h3>${t('solved')}</h3>${solved}
<h3>${t('revision')}</h3>${list(resolveLocalizedList(ch.revisionNotes, language).items)}
<h3>${t('uses')}</h3>${list(resolveLocalizedList(ch.realLifeApplications, language).items)}
<h3>${t('qa')}</h3><ol>${qa}</ol>
<h3>${t('quiz')}</h3><ol>${quiz}</ol>
<h3>${t('activity')}</h3>${acts}</section>`;
    })
    .join('\n');

  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gyaan Graph — ${esc(syllabusLabel)}</title>
<style>body{font:18px/1.7 system-ui,'Noto Sans Devanagari','Noto Sans Kannada',sans-serif;max-width:46rem;margin:0 auto;padding:1rem;color:#22163F;background:#F5F0FF}
h1{color:#2E1A6E}h2{color:#5B21B6;border-top:3px solid #6D28D9;padding-top:1rem;margin-top:2.5rem}h3{color:#2E1A6E;margin-bottom:.2rem}
code{background:#fff;border:1px solid #E7DDFB;border-radius:6px;padding:.1rem .4rem;font-size:.95em}small,.tag{color:#4A3F66}
section{break-inside:auto}@media print{body{background:#fff;font-size:12pt}h2{break-before:page}}</style></head><body>
<h1>Gyaan Graph</h1><p><b>${t('syllabus')}:</b> ${esc(syllabusLabel)}</p><p><small>${t('note')}</small></p>
${body}</body></html>`;
}

export function downloadTextFile(filename: string, content: string, mime = 'text/html'): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ---------- Offline readiness ---------- */

export interface OfflineStatus {
  serviceWorker: 'active' | 'installing' | 'none' | 'unsupported';
  cachedFiles: number;
  storageMb: number | null;
}

export async function getOfflineStatus(): Promise<OfflineStatus> {
  let serviceWorker: OfflineStatus['serviceWorker'] = 'unsupported';
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    serviceWorker = reg?.active ? 'active' : reg?.installing || reg?.waiting ? 'installing' : 'none';
  }
  let cachedFiles = 0;
  if ('caches' in window) {
    for (const name of await caches.keys()) {
      if (/precache|workbox/i.test(name)) cachedFiles += (await (await caches.open(name)).keys()).length;
    }
  }
  let storageMb: number | null = null;
  try {
    const est = await navigator.storage?.estimate?.();
    if (est?.usage != null) storageMb = Math.round((est.usage / 1048576) * 10) / 10;
  } catch {
    storageMb = null;
  }
  return { serviceWorker, cachedFiles, storageMb };
}

/** Fetch the lazy 3D chunks now (while online) so simulations also open offline. */
export async function warmSimulationChunks(): Promise<void> {
  await Promise.allSettled([
    import('../components/PhysicsExperiment3DScene'),
    import('../components/Magnetism3DScene'),
    import('../components/InlineSimulation'),
    import('../components/FlashcardTrainer'),
  ]);
}
