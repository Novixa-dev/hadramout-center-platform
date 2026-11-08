import { NextResponse } from 'next/server';
import { normalizeScholarlyArabic, auditScholarlyArabic } from '../../../../lib/arabic-assist.ts';
import { cleanDescription, clip, describe } from '../../../../lib/seo-text.ts';
import { htmlToText } from '../../../../lib/sanitize.ts';
import { appConfig } from '../../../../lib/runtime-light.ts';
import { getPayloadClient } from '../../../../lib/runtime.ts';
import { isLangEnabled } from '../../../../config.ts';
import { createProvider } from '../../../../i18n/translation/providers.ts';
import { TranslationEngine } from '../../../../i18n/translation/engine.ts';
import { TranslationError } from '../../../../i18n/translation/types.ts';
import { getLanguage } from '../../../../i18n/languages.ts';
import { allow } from '../../../../lib/ratelimit.ts';
import { canEdit, staffUser } from '../../../../lib/staff.ts';
import { ACADEMIC_TEMPLATE, MAX_ASSIST_CHARS, assistAction, firstSentences } from '../../../../lib/editorial-assist.ts';

export const dynamic = 'force-dynamic';

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'cache-control': 'no-store' } });

/**
 * Editorial assistant for the admin's page editor. Staff only (editors and admins): every action runs on the server and
 * `translate` spends the translation budget, so a visitor must never reach it.
 */
export async function POST(req: Request) {
  const user = await staffUser(req.headers);
  if (!user) return json({ error: 'unauthorized' }, 401);
  if (!canEdit(user)) return json({ error: 'forbidden' }, 403);
  // generous for a person, tight for a script: 60 calls per 10 minutes per account
  if (!allow(`assist:${user.id}`, 60, 600)) return json({ error: 'rate limited' }, 429);

  if (Number(req.headers.get('content-length') ?? 0) > MAX_ASSIST_CHARS * 4) return json({ error: 'too large' }, 413);
  let body: { action?: unknown; text?: unknown; title?: unknown; lead?: unknown; body?: unknown; targetLang?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const text = str(body.text);
  const title = str(body.title);
  const lead = str(body.lead);
  const html = str(body.body);
  if (text.length + title.length + lead.length + html.length > MAX_ASSIST_CHARS) return json({ error: 'too large' }, 413);

  switch (assistAction(body.action, typeof body.text === 'string')) {
    case 'normalize':
      if (!text) return json({ error: 'missing text' }, 400);
      return json({ normalized: normalizeScholarlyArabic(text), suggestions: auditScholarlyArabic(text) });

    case 'auto-fill-seo': {
      const baseTitle = normalizeScholarlyArabic(title || 'مركز حضرموت للدراسات التاريخية');
      const plain = htmlToText(html);
      const metaDescription = lead
        ? cleanDescription(normalizeScholarlyArabic(lead))
        : plain
          ? describe(normalizeScholarlyArabic(plain))
          : `${baseTitle} — مركز حضرموت للدراسات التاريخية والتوثيق والنشر (المكلا، اليمن).`;
      return json({ metaTitle: clip(baseTitle, 58), metaDescription: metaDescription.length > 155 ? clip(metaDescription, 152) : metaDescription });
    }

    case 'auto-fill-lead':
      return json({ lead: firstSentences(htmlToText(html)) });

    case 'academic-template':
      return json({ template: ACADEMIC_TEMPLATE });

    case 'translate': {
      const lang = str(body.targetLang).toLowerCase();
      const cfg = appConfig();
      // Arabic is the source: "translating" into it would overwrite the original text
      if (!getLanguage(lang) || lang === 'ar' || !isLangEnabled(cfg, lang)) return json({ error: 'invalid language' }, 400);
      if (cfg.translation.provider === 'none') return json({ error: 'no-provider' }, 503);
      const engine = new TranslationEngine({ payload: await getPayloadClient(), provider: createProvider(cfg), isLanguageEnabled: (l) => isLangEnabled(cfg, l), dailyCharLimit: cfg.translation.dailyCharLimit });
      try {
        const [translatedTitle, translatedLead, translatedBody] = await engine.translateFragments(lang, [
          { text: title, html: false },
          { text: lead, html: false },
          { text: html, html: true },
        ]);
        return json({ translatedTitle, translatedLead, translatedBody });
      } catch (err) {
        if (err instanceof TranslationError && /limit/.test(err.message)) return json({ error: 'budget' }, 429);
        console.error('[editorial-assist] translate', (err as Error).message);
        return json({ error: 'translation failed' }, 502);
      }
    }

    default:
      return json({ error: 'unknown action' }, 400);
  }
}
