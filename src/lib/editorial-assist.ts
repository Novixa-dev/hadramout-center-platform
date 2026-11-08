import { clip } from './seo-text.ts';
import { normalizeScholarlyArabic } from './arabic-assist.ts';

/** Upper bound for all text sent in one assistant call (a long study is ~60k characters). */
export const MAX_ASSIST_CHARS = 120_000;

const ACTIONS = ['normalize', 'auto-fill-seo', 'auto-fill-lead', 'academic-template', 'translate'] as const;
export type AssistAction = (typeof ACTIONS)[number];

/** The requested action; older callers send only `text`, which means "normalize". Unknown values stay unknown. */
export function assistAction(action: unknown, hasText: boolean): AssistAction | null {
  if (action === undefined || action === null || action === '') return hasText ? 'normalize' : 'auto-fill-seo';
  return (ACTIONS as readonly unknown[]).includes(action) ? (action as AssistAction) : null;
}

/** The first one or two sentences of a text as a lead (Arabic and Latin sentence ends), at most ~240 characters. */
export function firstSentences(text: string): string {
  if (!text) return '';
  const lead = text.split(/(?<=[.!?؟])\s+/).slice(0, 2).join(' ').trim();
  return normalizeScholarlyArabic(lead.length > 250 ? clip(lead, 240) : lead);
}

/** Section skeleton for a study; headings only plus one placeholder line each, for the editor to replace. */
export const ACADEMIC_TEMPLATE = `<h2>مقدمة ومدخل تاريخي</h2>
<p>توطئة حول موضوع البحث، وسياقه التاريخي والتوثيقي في حضرموت وجنوب الجزيرة العربية...</p>
<h2>المحاور والمباحث التوثيقية</h2>
<p>تفصيل المبحث الأول وتحليل الوثائق والمصادر والشواهد التاريخية المرتبطة...</p>
<h2>النتائج والتوصيات</h2>
<p>خلاصة النتائج العلمية التي خلصت إليها هذه المادة البحثية...</p>
<h2>المصادر والمراجع</h2>
<ol>
  <li>المصدر الأول: اسم الكتاب، المؤلف، الطبعة وسنة النشر.</li>
  <li>المصدر الثاني: ...</li>
</ol>`;
